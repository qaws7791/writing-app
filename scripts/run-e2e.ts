import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const options = readOptions(Bun.argv.slice(2))
const runRoot = await mkdtemp(path.join(tmpdir(), "writing-app-e2e-"))
const databaseUrl = path.join(runRoot, "writing-app.sqlite")
const runId = path.basename(runRoot)

try {
  const playwright = Bun.spawn(
    [
      "node",
      path.join(repositoryRoot, "node_modules/@playwright/test/cli.js"),
      "test",
      ...options.playwrightArguments,
    ],
    {
      cwd: repositoryRoot,
      env: {
        ...process.env,
        E2E_DATABASE_URL: databaseUrl,
        E2E_RUN_ROOT: runRoot,
        E2E_RUNTIME: options.runtime,
        E2E_SERVER_SCOPE: options.serverScope,
      },
      stderr: "inherit",
      stdin: "inherit",
      stdout: "inherit",
    }
  )
  process.exitCode = await playwright.exited
} finally {
  await Promise.all([
    rm(runRoot, { force: true, recursive: true }),
    rm(path.join(repositoryRoot, "apps/admin/.next/e2e", runId), {
      force: true,
      recursive: true,
    }),
    rm(path.join(repositoryRoot, "apps/web/.next/e2e", runId), {
      force: true,
      recursive: true,
    }),
  ])
}

interface E2eOptions {
  readonly playwrightArguments: readonly string[]
  readonly runtime: "development" | "standalone"
  readonly serverScope: "all" | "learner"
}

function readOptions(arguments_: readonly string[]): E2eOptions {
  const playwrightArguments: string[] = []
  let runtime: E2eOptions["runtime"] = "development"
  let serverScope: E2eOptions["serverScope"] = "all"

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]
    if (argument !== "--runtime" && argument !== "--server-scope") {
      playwrightArguments.push(argument)
      continue
    }

    const value = arguments_[index + 1]
    if (
      argument === "--runtime" &&
      (value === "development" || value === "standalone")
    ) {
      runtime = value
    } else if (
      argument === "--server-scope" &&
      (value === "all" || value === "learner")
    ) {
      serverScope = value
    } else {
      throw new Error(`${argument} 값이 올바르지 않습니다.`)
    }
    index += 1
  }

  return { playwrightArguments, runtime, serverScope }
}
