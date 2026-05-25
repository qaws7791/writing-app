import { rm } from "node:fs/promises"
import { spawn } from "node:child_process"
import { afterEach, describe, expect, it } from "vitest"

const smokeDatabasePath = "data/test-startup.sqlite"

afterEach(async () => {
  await rm(smokeDatabasePath, { force: true })
})

describe("api startup", () => {
  it("starts with the default development environment", async () => {
    const port = 4423
    const env = {
      ...process.env,
      DATABASE_URL: `file:${smokeDatabasePath}`,
      PORT: String(port),
    }
    delete env.NODE_ENV

    const apiProcess = spawn("bun", ["src/main.ts"], {
      cwd: `${import.meta.dir}/..`,
      env,
    })
    let stderr = ""
    apiProcess.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    const exited = new Promise<number | null>((resolve) => {
      apiProcess.on("exit", resolve)
    })

    try {
      const response = await waitForHealth(port, exited, () => stderr)

      expect(response).toEqual({
        database: "ok",
        status: "ok",
      })
    } finally {
      apiProcess.kill()
      await exited
    }
  })
})

async function waitForHealth(
  port: number,
  exited: Promise<number | null>,
  readStderr: () => string
) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const exitCode = await Promise.race([
      exited,
      sleep(0).then(() => undefined),
    ])
    if (exitCode !== undefined) {
      throw new Error(`API exited before startup: ${readStderr()}`)
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`)

      if (response.ok) {
        return response.json()
      }
    } catch {
      await sleep(250)
    }
  }

  throw new Error("API did not start before the timeout.")
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
