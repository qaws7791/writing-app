import { serve } from "bun"
import { Database } from "bun:sqlite"

import {
  createUnifiedApiServerLifecycle,
  registerUnifiedApiShutdownSignals,
} from "@/server-lifecycle"

type ShutdownProcessEvent =
  | { readonly event: "ready"; readonly port: number }
  | { readonly event: "request-started" }
  | { readonly event: "shutdown-started" }
  | {
      readonly closeCount: number
      readonly databaseClosed: boolean
      readonly event: "shutdown-complete"
      readonly port: number
    }

let closeCount = 0
let shutdownStarted = false
const releaseRequest = createDeferred()
const database = new Database(":memory:")
const lifecycle = createUnifiedApiServerLifecycle({
  closeDatabase() {
    closeCount += 1
    database.close()
  },
  async fetch(request) {
    if (new URL(request.url).pathname === "/slow") {
      writeEvent({ event: "request-started" })
      await releaseRequest.promise
      return new Response("진행 요청 완료")
    }
    return new Response("ok")
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

    if (command === "release-request") releaseRequest.resolve()
    if (command === "shutdown") void requestShutdown()
  }
})

writeEvent({ event: "ready", port })

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
