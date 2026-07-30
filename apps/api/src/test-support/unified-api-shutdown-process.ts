import { serve } from "bun"
import { Database } from "bun:sqlite"

import {
  createUnifiedApiServerLifecycle,
  registerUnifiedApiShutdownSignals,
} from "@/lifecycle/server-lifecycle"

type ShutdownProcessEvent =
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

const drainTimeoutMilliseconds = readDrainTimeoutMilliseconds()
let closeCount = 0
let shutdownStarted = false
const releaseRequest = createDeferred()
const database = new Database(":memory:")
const lifecycle = createUnifiedApiServerLifecycle({
  disposeContainer() {
    closeCount += 1
    database.close()
  },
  drainTimeoutMilliseconds,
  async fetch(request) {
    if (new URL(request.url).pathname === "/slow") {
      writeEvent({ event: "request-started" })
      await releaseRequest.promise
      return new Response("진행 요청 완료")
    }
    return new Response("ok")
  },
  onDrainResult(observation) {
    writeEvent({
      activeActivities: observation.activeActivities,
      event: "drain-result",
      result: observation.result,
    })
  },
  onShutdownError(error, phase) {
    process.stderr.write(`${phase}: ${String(error)}\n`)
  },
})
const server = serve({
  fetch: lifecycle.fetch,
  hostname: "127.0.0.1",
  port: 0,
})
const port = server.port
if (port === undefined) {
  throw new Error("lifecycle process server port가 할당되지 않았습니다.")
}
lifecycle.attachServer(server)

async function requestShutdown(): Promise<void> {
  if (shutdownStarted) return

  shutdownStarted = true
  writeEvent({ event: "shutdown-started" })
  await lifecycle.shutdown()

  let databaseClosed = false
  try {
    database.query("SELECT 1").get()
  } catch {
    databaseClosed = true
  }

  process.stdout.write(
    `${JSON.stringify({
      closeCount,
      databaseClosed,
      event: "shutdown-complete",
      port,
    })}\n`,
    () => process.exit(0)
  )
}

registerUnifiedApiShutdownSignals(requestShutdown)

let inputBuffer = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", (chunk) => {
  inputBuffer += chunk

  while (inputBuffer.includes("\n")) {
    const newlineIndex = inputBuffer.indexOf("\n")
    const command = inputBuffer.slice(0, newlineIndex).trim()
    inputBuffer = inputBuffer.slice(newlineIndex + 1)

    if (command === "acquire-lease") acquireLongLivedLease()
    if (command === "release-request") releaseRequest.resolve()
    if (command === "shutdown") void requestShutdown()
  }
})

writeEvent({ event: "ready", port })

function acquireLongLivedLease(): void {
  const lease = lifecycle.acquireLongLivedLease("long-lived-stream")
  lease.signal.addEventListener(
    "abort",
    () => writeEvent({ event: "lease-aborted" }),
    { once: true }
  )
  writeEvent({ event: "lease-acquired" })
}

function readDrainTimeoutMilliseconds(): number | undefined {
  const argument = process.argv
    .slice(2)
    .find((value) => value.startsWith("--drain-timeout-ms="))
  if (argument === undefined) return undefined

  const parsed = Number(argument.slice("--drain-timeout-ms=".length))
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error("--drain-timeout-ms는 0 이상의 정수여야 합니다.")
  }
  return parsed
}

function writeEvent(event: ShutdownProcessEvent): void {
  process.stdout.write(`${JSON.stringify(event)}\n`)
}

function createDeferred(): {
  readonly promise: Promise<void>
  readonly resolve: () => void
} {
  let resolve: (() => void) | undefined
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise
  })

  return {
    promise,
    resolve() {
      resolve?.()
    },
  }
}
