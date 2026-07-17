import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { resolve } from "node:path"

import { expect, it } from "vitest"

type LifecycleProcessEvent =
  | { readonly event: "ready"; readonly port: number }
  | { readonly event: "request-started" }
  | { readonly event: "shutdown-started" }
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

it("SIGTERM 뒤 진행 body를 drain하고 DB close 1회와 port 해제를 보장한다", async () => {
  const child = spawn(
    process.execPath,
    [
      resolve(
        import.meta.dirname,
        "test-support/learner-api-shutdown-process.ts"
      ),
    ],
    {
      cwd: resolve(import.meta.dirname, ".."),
      stdio: "pipe",
    }
  )
  const events = createProcessEventReader(child)
  const exit = createProcessExitReader(child)

  try {
    const ready = await events.waitFor("ready")
    if (ready.event !== "ready") throw new Error("ready event가 필요합니다.")

    const inFlight = fetch(`http://127.0.0.1:${ready.port}/slow`)
    await events.waitFor("request-started")

    if (process.platform === "win32") {
      child.stdin.write("shutdown\n")
    } else {
      child.kill("SIGTERM")
    }
    await events.waitFor("shutdown-started")
    child.stdin.write("release-request\n")

    await expect(inFlight.then((response) => response.text())).resolves.toBe(
      "진행 요청 완료"
    )
    const completed = await events.waitFor("shutdown-complete")
    if (completed.event !== "shutdown-complete") {
      throw new Error("shutdown-complete event가 필요합니다.")
    }

    await expect(exit.wait()).resolves.toEqual({ code: 0, signal: null })
    expect(completed).toEqual({
      closeCount: 1,
      databaseClosed: true,
      event: "shutdown-complete",
      port: ready.port,
    })

    const reboundServer = Bun.serve({
      fetch: () => new Response("ok"),
      hostname: "127.0.0.1",
      port: ready.port,
    })
    try {
      expect(reboundServer.port).toBe(ready.port)
    } finally {
      await reboundServer.stop(true)
    }
  } finally {
    if (exit.current === undefined) {
      child.kill("SIGKILL")
      await exit.wait()
    }
  }
}, 10_000)

it.skipIf(process.platform === "win32")(
  "signal로 종료된 child의 code와 signal을 한 번만 관찰해 cache한다",
  async () => {
    const child = spawn(
      process.execPath,
      ["-e", 'process.stdout.write("ready\\n"); process.stdin.resume()'],
      { stdio: "pipe" }
    )
    const exit = createProcessExitReader(child)

    try {
      await waitForProcessOutput(child, "ready")
      child.kill("SIGTERM")

      const firstObservation = await exit.wait()
      const repeatedObservation = await exit.wait()

      expect(firstObservation).toEqual({ code: null, signal: "SIGTERM" })
      expect(repeatedObservation).toBe(firstObservation)
      expect(exit.current).toBe(firstObservation)
    } finally {
      if (exit.current === undefined) {
        child.kill("SIGKILL")
        await exit.wait()
      }
    }
  }
)

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

function waitForProcessOutput(
  child: ChildProcessWithoutNullStreams,
  expectedOutput: string
): Promise<void> {
  return new Promise((resolveOutput, rejectOutput) => {
    const handleExit = (code: number | null, signal: NodeJS.Signals | null) => {
      rejectOutput(
        new Error(
          `lifecycle child가 ${expectedOutput} 출력 전에 종료되었습니다: code=${String(code)}, signal=${String(signal)}`
        )
      )
    }
    child.once("exit", handleExit)
    child.stdout.once("data", (chunk) => {
      child.removeListener("exit", handleExit)
      const output = String(chunk)
      if (!output.includes(expectedOutput)) {
        rejectOutput(new Error(`예상하지 못한 lifecycle child 출력: ${output}`))
        return
      }

      resolveOutput()
    })
  })
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
