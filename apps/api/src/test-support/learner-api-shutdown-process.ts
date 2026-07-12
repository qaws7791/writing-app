import { serve } from "bun"
import { Database } from "bun:sqlite"
import { writeFileSync } from "node:fs"

import {
  createLearnerApiServerLifecycle,
  registerLearnerApiShutdownSignals,
} from "@/server-lifecycle"

let closeCount = 0
let reportStarted = false
const database = new Database(":memory:")
const reportPath = process.argv[2]
if (reportPath === undefined) {
  throw new Error("수명주기 보고서 경로 인자가 필요합니다.")
}
const lifecycleReportPath = reportPath
const lifecycle = createLearnerApiServerLifecycle({
  closeCore() {
    closeCount += 1
    database.close()
  },
  async fetch(request) {
    if (new URL(request.url).pathname === "/slow") {
      await Bun.sleep(150)
      return new Response("진행 요청 완료")
    }
    return new Response("ok")
  },
  onShutdownError(error, phase) {
    process.stderr.write(`${phase}: ${String(error)}\n`)
  },
})
const server = serve({ fetch: lifecycle.fetch, port: 0 })
const port = server.port
lifecycle.attachServer(server)

function requestShutdown(): void {
  if (reportStarted) return
  reportStarted = true
  void lifecycle.shutdown().then(() => {
    let databaseClosed = false
    try {
      database.query("SELECT 1").get()
    } catch {
      databaseClosed = true
    }
    writeFileSync(
      lifecycleReportPath,
      JSON.stringify({ closeCount, databaseClosed, port }),
      "utf8"
    )
    process.exit(0)
  })
}

registerLearnerApiShutdownSignals(async () => {
  requestShutdown()
  await lifecycle.shutdown()
})
process.stdin.on("data", (chunk) => {
  if (chunk.toString().trim() === "SIGTERM") requestShutdown()
})
writeFileSync(lifecycleReportPath, JSON.stringify({ port }), "utf8")
