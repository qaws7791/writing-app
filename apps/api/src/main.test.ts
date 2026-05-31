import { createServer } from "node:net"
import { rm } from "node:fs/promises"
import { spawn, spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

const smokeDatabasePath = "data/test-startup.sqlite"

afterEach(async () => {
  await rm(smokeDatabasePath, { force: true })
  await rm(`${smokeDatabasePath}-shm`, { force: true })
  await rm(`${smokeDatabasePath}-wal`, { force: true })
})

describe("api startup", () => {
  it("starts with the default development environment", async () => {
    const port = await getAvailablePort()
    const env = {
      ...process.env,
      BETTER_AUTH_SECRET: "test-secret-with-enough-length",
      BETTER_AUTH_URL: `http://localhost:${port}`,
      DATABASE_URL: `file:${smokeDatabasePath}`,
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      OPENAI_API_KEY: "openai-api-key",
      OPENAI_MODEL: "gpt-5-mini",
      PORT: String(port),
    }
    delete env.NODE_ENV

    const apiProcess = spawn(resolveBunExecutable(), ["src/main.ts"], {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
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
      expect(readTableNames(smokeDatabasePath)).not.toContain(
        "schema_migrations"
      )
      expect(readTableNames(smokeDatabasePath)).not.toContain(
        "course_categories"
      )
    } finally {
      apiProcess.kill()
      await exited
    }
  }, 15_000)
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

function readTableNames(databasePath: string) {
  const result = spawnSync(
    resolveBunExecutable(),
    [
      "--eval",
      `
        import { Database } from "bun:sqlite";
        const sqlite = new Database(${JSON.stringify(databasePath)});
        const tables = sqlite
          .query("select name from sqlite_master where type = 'table' order by name")
          .all()
          .map((row) => row.name);
        sqlite.close();
        console.log(JSON.stringify(tables));
      `,
    ],
    {
      encoding: "utf8",
    }
  )

  if (result.status !== 0) {
    throw new Error(result.stderr)
  }

  return JSON.parse(result.stdout) as string[]
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function resolveBunExecutable() {
  return (
    process.env.BUN_EXECUTABLE ?? join(process.env.HOME ?? "", ".bun/bin/bun")
  )
}

function getAvailablePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer()

    server.on("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Failed to allocate a test port.")))
        return
      }

      server.close(() => resolve(address.port))
    })
  })
}
