import { spawn } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { expect, it } from "vitest"

it("진행 요청 중 SIGTERM 뒤 요청을 drain하고 core를 닫은 채 process가 종료된다", async () => {
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), "writing-app-api-lifecycle-")
  )
  const reportPath = join(temporaryDirectory, "lifecycle.json")
  const child = spawn(
    "bun",
    [
      resolve(
        import.meta.dirname,
        "test-support/learner-api-shutdown-process.ts"
      ),
      reportPath,
    ],
    {
      cwd: resolve(import.meta.dirname, ".."),
      stdio: "pipe",
    }
  )

  try {
    const startup = await waitForReport(reportPath, "port")
    const inFlight = fetch(`http://127.0.0.1:${startup.port}/slow`)
    await Bun.sleep(50)

    if (process.platform === "win32") {
      child.stdin.write("SIGTERM\n")
    } else {
      child.kill("SIGTERM")
    }

    await expect(inFlight.then((response) => response.text())).resolves.toBe(
      "진행 요청 완료"
    )
    await expect(waitForExit(child)).resolves.toBe(0)
    await expect(waitForReport(reportPath, "closeCount")).resolves.toEqual({
      closeCount: 1,
      databaseClosed: true,
      port: startup.port,
    })
  } finally {
    if (child.exitCode === null) child.kill("SIGKILL")
    rmSync(temporaryDirectory, { force: true, recursive: true })
  }
}, 10_000)

async function waitForReport(
  reportPath: string,
  requiredProperty: "closeCount" | "port"
): Promise<{
  readonly closeCount?: number
  readonly databaseClosed?: boolean
  readonly port: number
}> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const value = JSON.parse(readFileSync(reportPath, "utf8")) as {
        readonly closeCount?: number
        readonly databaseClosed?: boolean
        readonly port: number
      }
      if (requiredProperty in value) return value
    } catch {
      // process가 report를 원자적으로 쓰는 짧은 구간을 기다린다.
    }
    await Bun.sleep(20)
  }
  throw new Error(`학습자 API process report timeout: ${requiredProperty}`)
}

function waitForExit(child: ReturnType<typeof spawn>): Promise<number | null> {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode)
  return new Promise((resolve) => child.once("exit", resolve))
}
