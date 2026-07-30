import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { resolve } from "node:path"

import { expect, it } from "vitest"

type LifecycleProcessEvent =
  | { readonly event: "ready"; readonly port: number }
  | { readonly event: "request-started" }
  | { readonly event: "lease-acquired" }
  | { readonly event: "lease-aborted" }
  | { readonly event: "shutdown-started" }
  | {
      readonly activeActivities: number
      readonly event: "drain-result"
      readonly result: "drained" | "timed-out"
    }
  | {
      readonly closeCount: number
      readonly databaseClosed: boolean
      readonly event: "shutdown-complete"
      readonly port: number
    }

type LifecycleProcessExit = {
  readonly code: number | null
  readonly signal: NodeJS.Signals | null
}

type LifecycleProcess = {
  readonly events: ReturnType<typeof createProcessEventReader>
  readonly exit: ReturnType<typeof createProcessExitReader>
  readonly requestShutdown: () => void
  readonly send: (_command: string) => void
  readonly waitForReadyPort: () => Promise<number>
}

it("SIGTERM 뒤 진행 body를 drain하고 DB close 1회와 port 해제를 보장한다", async () => {
  await withLifecycleProcess([], async (lifecycle) => {
    const port = await lifecycle.waitForReadyPort()
    const inFlight = fetch(`http://127.0.0.1:${port}/slow`)
    await lifecycle.events.waitFor("request-started")

    lifecycle.requestShutdown()
    await lifecycle.events.waitFor("shutdown-started")
    lifecycle.send("release-request")

    await expect(inFlight.then((response) => response.text())).resolves.toBe(
      "진행 요청 완료"
    )
    await expect(lifecycle.events.waitFor("drain-result")).resolves.toEqual({
      activeActivities: 1,
      event: "drain-result",
      result: "drained",
    })
    await expectPortReleasedAfterShutdown(lifecycle, port)
  })
}, 10_000)

it("long-lived lease가 걸린 채 drain deadline이 지나도 lease를 끊고 port를 해제한다", async () => {
  await withLifecycleProcess(["--drain-timeout-ms=50"], async (lifecycle) => {
    const port = await lifecycle.waitForReadyPort()
    lifecycle.send("acquire-lease")
    await lifecycle.events.waitFor("lease-acquired")

    lifecycle.requestShutdown()
    await lifecycle.events.waitFor("shutdown-started")

    await expect(lifecycle.events.waitFor("drain-result")).resolves.toEqual({
      activeActivities: 1,
      event: "drain-result",
      result: "timed-out",
    })
    await lifecycle.events.waitFor("lease-aborted")
    await expectPortReleasedAfterShutdown(lifecycle, port)
  })
}, 10_000)

async function expectPortReleasedAfterShutdown(
  lifecycle: LifecycleProcess,
  port: number
): Promise<void> {
  const completed = await lifecycle.events.waitFor("shutdown-complete")

  await expect(lifecycle.exit.wait()).resolves.toEqual({
    code: 0,
    signal: null,
  })
  expect(completed).toEqual({
    closeCount: 1,
    databaseClosed: true,
    event: "shutdown-complete",
    port,
  })

  const reboundServer = Bun.serve({
    fetch: () => new Response("ok"),
    hostname: "127.0.0.1",
    port,
  })
  try {
    expect(reboundServer.port).toBe(port)
  } finally {
    await reboundServer.stop(true)
  }
}

async function withLifecycleProcess(
  args: readonly string[],
  run: (_lifecycle: LifecycleProcess) => Promise<void>
): Promise<void> {
  const child = spawn(
    process.execPath,
    [
      resolve(
        import.meta.dirname,
        "../test-support/unified-api-shutdown-process.ts"
      ),
      ...args,
    ],
    {
      cwd: resolve(import.meta.dirname, "../.."),
      stdio: "pipe",
    }
  )
  const events = createProcessEventReader(child)
  const exit = createProcessExitReader(child)
  const lifecycle: LifecycleProcess = {
    events,
    exit,
    requestShutdown() {
      if (process.platform === "win32") {
        child.stdin.write("shutdown\n")
      } else {
        child.kill("SIGTERM")
      }
    },
    send(command) {
      child.stdin.write(`${command}\n`)
    },
    async waitForReadyPort() {
      const ready = await events.waitFor("ready")
      if (ready.event !== "ready") throw new Error("ready event가 필요합니다.")
      return ready.port
    },
  }

  try {
    await run(lifecycle)
  } finally {
    if (exit.current === undefined) {
      child.kill("SIGKILL")
      await exit.wait()
    }
  }
}

function createProcessEventReader(child: ChildProcessWithoutNullStreams): {
  readonly waitFor: (
    _event: LifecycleProcessEvent["event"]
  ) => Promise<LifecycleProcessEvent>
} {
  const queuedEvents: LifecycleProcessEvent[] = []
  const waiters: {
    readonly event: LifecycleProcessEvent["event"]
    readonly reject: (_error: Error) => void
    readonly resolve: (_event: LifecycleProcessEvent) => void
  }[] = []
  let outputBuffer = ""
  let standardError = ""

  child.stdout.setEncoding("utf8")
  child.stderr.setEncoding("utf8")
  child.stderr.on("data", (chunk) => {
    standardError += chunk
  })
  child.stdout.on("data", (chunk) => {
    outputBuffer += chunk

    while (outputBuffer.includes("\n")) {
      const newlineIndex = outputBuffer.indexOf("\n")
      const line = outputBuffer.slice(0, newlineIndex)
      outputBuffer = outputBuffer.slice(newlineIndex + 1)
      if (line.length === 0) continue

      const event = JSON.parse(line) as LifecycleProcessEvent
      const waiterIndex = waiters.findIndex(
        (waiter) => waiter.event === event.event
      )
      const waiter = waiters[waiterIndex]
      if (waiter === undefined) {
        queuedEvents.push(event)
      } else {
        waiters.splice(waiterIndex, 1)
        waiter.resolve(event)
      }
    }
  })
  child.once("exit", (code, signal) => {
    for (const waiter of waiters) {
      waiter.reject(
        new Error(
          `lifecycle child가 ${waiter.event} 전에 종료되었습니다: code=${String(code)}, signal=${String(signal)}, stderr=${standardError}`
        )
      )
    }
    waiters.splice(0)
  })

  return {
    waitFor(expectedEvent) {
      const queuedIndex = queuedEvents.findIndex(
        (event) => event.event === expectedEvent
      )
      const queued = queuedEvents[queuedIndex]
      if (queued !== undefined) {
        queuedEvents.splice(queuedIndex, 1)
        return Promise.resolve(queued)
      }

      return new Promise((resolveEvent, rejectEvent) => {
        waiters.push({
          event: expectedEvent,
          reject: rejectEvent,
          resolve: resolveEvent,
        })
      })
    },
  }
}

function createProcessExitReader(child: ChildProcessWithoutNullStreams): {
  readonly current: LifecycleProcessExit | undefined
  readonly wait: () => Promise<LifecycleProcessExit>
} {
  let current = readCurrentProcessExit(child)
  const exit =
    current === undefined
      ? new Promise<LifecycleProcessExit>((resolveExit) => {
          child.once("exit", (code, signal) => {
            current = { code, signal }
            resolveExit(current)
          })
        })
      : Promise.resolve(current)

  return {
    get current() {
      return current
    },
    wait() {
      return exit
    },
  }
}

function readCurrentProcessExit(
  child: ChildProcessWithoutNullStreams
): LifecycleProcessExit | undefined {
  if (child.exitCode === null && child.signalCode === null) return undefined

  return {
    code: child.exitCode,
    signal: child.signalCode,
  }
}
