import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { resolve } from "node:path"
import { createInterface } from "node:readline"

import { expect, test } from "@playwright/test"

test("격리된 두 browser context가 file-backed transaction 뒤 같은 상태로 수렴한다", async ({
  browser,
}) => {
  const fixtureServer = await startFixtureServer()
  const firstContext = await browser.newContext()
  const secondContext = await browser.newContext()

  try {
    const firstPage = await firstContext.newPage()
    const secondPage = await secondContext.newPage()
    await Promise.all([
      firstPage.goto(`${fixtureServer.origin}/health`),
      secondPage.goto(`${fixtureServer.origin}/health`),
    ])
    await Promise.all([
      postJson(firstPage, "/submit/0"),
      postJson(secondPage, "/submit/1"),
    ])
    const [firstState, secondState] = await Promise.all([
      postJson(firstPage, "/converge/0"),
      postJson(secondPage, "/converge/1"),
    ])

    expect(firstState).toEqual(secondState)
    expect(firstState).toMatchObject({
      markdown: expect.stringContaining("클라이언트"),
    })
  } finally {
    await Promise.all([firstContext.close(), secondContext.close()])
    await fixtureServer.close()
  }
})

async function postJson(
  page: import("@playwright/test").Page,
  path: string
): Promise<unknown> {
  return page.evaluate(async (requestPath) => {
    const response = await fetch(requestPath, { method: "POST" })
    if (!response.ok) throw new Error(`fixture HTTP ${response.status}`)
    return response.json()
  }, path)
}

async function startFixtureServer(): Promise<{
  readonly close: () => Promise<void>
  readonly origin: string
}> {
  const process = spawn("bun", ["load/resource-document-browser-server.ts"], {
    cwd: resolve(import.meta.dirname, ".."),
    env: processEnv(),
    stdio: "pipe",
  })
  const lineReader = createInterface({ input: process.stdout })
  const firstLine = await readFirstLine(process, lineReader)
  const parsed = JSON.parse(firstLine) as { readonly port: number }

  return {
    async close() {
      lineReader.close()
      await fetch(`http://127.0.0.1:${parsed.port}/shutdown`, {
        method: "POST",
      })
      await waitForExit(process)
    },
    origin: `http://127.0.0.1:${parsed.port}`,
  }
}

function readFirstLine(
  process: ChildProcessWithoutNullStreams,
  lineReader: ReturnType<typeof createInterface>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("fixture server 시작 timeout")),
      10_000
    )
    lineReader.once("line", (line) => {
      clearTimeout(timeout)
      resolve(line)
    })
    process.once("exit", (code) => {
      clearTimeout(timeout)
      reject(new Error(`fixture server 조기 종료: ${code}`))
    })
  })
}

function waitForExit(process: ChildProcessWithoutNullStreams): Promise<void> {
  if (process.exitCode !== null) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      process.kill("SIGKILL")
      reject(new Error("fixture server 종료 timeout"))
    }, 10_000)
    process.once("exit", () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

function processEnv(): NodeJS.ProcessEnv {
  return { ...process.env, FORCE_COLOR: "0" }
}
