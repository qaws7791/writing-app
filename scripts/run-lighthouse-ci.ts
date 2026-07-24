import { mkdtemp, rm } from "node:fs/promises"
import { createServer } from "node:net"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "@playwright/test"

import {
  type E2eServerDefinition,
  type StartedE2eServer,
  startE2eServers,
  stopE2eProcess,
  stopE2eServers,
} from "#scripts/e2e-server-lifecycle"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const learnerWebOrigin = "http://localhost:3200"
const apiOrigin = "http://127.0.0.1:4100"
const shutdownSignals = ["SIGINT", "SIGTERM", "SIGHUP"] as const

if (import.meta.main) {
  process.exit(await runLighthouseCi())
}

async function runLighthouseCi(): Promise<number> {
  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), "writing-app-lighthouse-")
  )
  const chromeUserDataDirectory = path.join(
    temporaryDirectory,
    "chrome-profile"
  )
  const chromePath = chromium.executablePath()
  const chromeDebuggingPort = await findAvailableLoopbackPort()
  const databaseUrl = path.join(temporaryDirectory, "writing-app.sqlite")
  let servers: readonly StartedE2eServer[] = []
  let lighthouse: Bun.Subprocess<"ignore", "inherit", "inherit"> | undefined
  let cleanupPromise: Promise<void> | undefined
  let exitCode = 1
  let shutdownRequested = false

  const cleanup = () => {
    cleanupPromise ??= cleanupResources()
    return cleanupPromise
  }
  const signalHandlers = shutdownSignals.map((signal) => ({
    handler: () => {
      if (shutdownRequested) return
      shutdownRequested = true
      void cleanup()
        .catch(console.error)
        .finally(() => process.exit(signalExitCode(signal)))
    },
    signal,
  }))

  for (const { handler, signal } of signalHandlers) {
    process.on(signal, handler)
  }

  try {
    await rm(path.join(repositoryRoot, "output", "lighthouse"), {
      force: true,
      recursive: true,
    })
    servers = await startE2eServers(
      createServerDefinitions({
        chromeDebuggingPort,
        chromePath,
        chromeUserDataDirectory,
        databaseUrl,
        temporaryDirectory,
      }),
      {
        onServerStarted(server) {
          servers = [...servers, server]
        },
      }
    )

    const learnerCookie = await createLearnerSessionCookie()
    lighthouse = Bun.spawn({
      cmd: [
        "node",
        fileURLToPath(import.meta.resolve("@lhci/cli/src/cli.js")),
        "autorun",
        "--config=lighthouse-ci.config.cjs",
      ],
      cwd: repositoryRoot,
      detached: process.platform !== "win32",
      env: {
        ...process.env,
        LIGHTHOUSE_AUTH_COOKIE: learnerCookie,
        LIGHTHOUSE_CHROME_PATH: chromePath,
        LIGHTHOUSE_CHROME_DEBUGGING_PORT: String(chromeDebuggingPort),
      },
      stderr: "inherit",
      stdin: "ignore",
      stdout: "inherit",
      windowsHide: true,
    })

    exitCode = await lighthouse.exited
  } catch (error) {
    console.error(error)
  } finally {
    try {
      await cleanup()
    } catch (error) {
      console.error(error)
      exitCode = 1
    }
    for (const { handler, signal } of signalHandlers) {
      process.off(signal, handler)
    }
  }

  async function cleanupResources(): Promise<void> {
    const errors: unknown[] = []

    if (lighthouse !== undefined) {
      try {
        await stopE2eProcess(lighthouse, "Lighthouse CI")
      } catch (error) {
        errors.push(error)
      }
    }

    try {
      await stopE2eServers(servers)
    } catch (error) {
      errors.push(error)
    }

    await rm(temporaryDirectory, {
      force: true,
      maxRetries: 5,
      recursive: true,
      retryDelay: 200,
    })

    if (errors.length > 0) {
      throw new Error(
        `Lighthouse CI 자원 정리에 실패했습니다. ${errors.map(String).join("\n")}`
      )
    }
  }

  return exitCode
}

function createServerDefinitions({
  chromeDebuggingPort,
  chromePath,
  chromeUserDataDirectory,
  databaseUrl,
  temporaryDirectory,
}: {
  readonly chromeDebuggingPort: number
  readonly chromePath: string
  readonly chromeUserDataDirectory: string
  readonly databaseUrl: string
  readonly temporaryDirectory: string
}): readonly E2eServerDefinition[] {
  const fixtureEnvironment = {
    ...process.env,
    E2E_DATABASE_URL: databaseUrl,
    E2E_RUN_ROOT: temporaryDirectory,
  }

  return [
    {
      command: [
        chromePath,
        "--headless=new",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--remote-debugging-address=127.0.0.1",
        `--remote-debugging-port=${chromeDebuggingPort}`,
        `--user-data-dir=${chromeUserDataDirectory}`,
        "about:blank",
      ],
      cwd: repositoryRoot,
      env: process.env,
      name: "Lighthouse Chrome",
      readinessUrl: `http://127.0.0.1:${chromeDebuggingPort}/json/version`,
    },
    {
      command: [process.execPath, "e2e/fixture-server.ts"],
      cwd: repositoryRoot,
      env: fixtureEnvironment,
      name: "Lighthouse fixture",
      readinessUrl: "http://127.0.0.1:4199",
    },
    {
      command: [process.execPath, "apps/api/src/scripts/start-e2e-api.ts"],
      cwd: repositoryRoot,
      env: {
        ...fixtureEnvironment,
        ADMIN_AUTH_SECRET:
          "lighthouse-admin-auth-secret-must-have-32-characters",
        ADMIN_ORIGIN: "http://127.0.0.1:3201",
        API_PORT: "4100",
        DATABASE_URL: databaseUrl,
        LEARNER_AUTH_SECRET:
          "lighthouse-learner-auth-secret-must-have-32-characters",
        NODE_ENV: "test",
        WEB_ORIGIN: learnerWebOrigin,
      },
      name: "Lighthouse API",
      readinessUrl: `${apiOrigin}/api/health`,
    },
    {
      command: ["node", "scripts/run-next-standalone.mjs", "web"],
      cwd: repositoryRoot,
      env: {
        ...fixtureEnvironment,
        API_BASE_URL: apiOrigin,
        HOSTNAME: "localhost",
        NODE_ENV: "production",
        PORT: "3200",
        WEB_ORIGIN: learnerWebOrigin,
      },
      name: "Lighthouse learner web",
      readinessUrl: learnerWebOrigin,
    },
  ]
}

function findAvailableLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()

    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()

      if (address === null || typeof address === "string") {
        server.close()
        reject(
          new Error("Lighthouse Chrome 디버깅 포트를 할당하지 못했습니다.")
        )
        return
      }

      server.close((error) => {
        if (error !== undefined) {
          reject(error)
          return
        }

        resolve(address.port)
      })
    })
  })
}

async function createLearnerSessionCookie(): Promise<string> {
  const signInUrl = new URL("/api/auth/sign-in/email", apiOrigin)
  const response = await fetch(signInUrl, {
    body: JSON.stringify({
      email: "learner@example.com",
      password: "e2e-password-123",
    }),
    headers: {
      "Content-Type": "application/json",
      Origin: learnerWebOrigin,
      "X-Writing-App-Client-IP": "127.0.0.91",
    },
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(
      `Lighthouse 학습자 fixture 로그인에 실패했습니다: HTTP ${response.status}`
    )
  }

  const cookiePairs = response.headers
    .getSetCookie()
    .map((setCookie) => setCookie.split(";", 1)[0]?.trim())
    .filter((cookie): cookie is string => cookie !== undefined && cookie !== "")

  if (cookiePairs.length === 0) {
    throw new Error("Lighthouse 학습자 fixture 로그인 cookie가 없습니다.")
  }

  return cookiePairs.join("; ")
}

function signalExitCode(signal: (typeof shutdownSignals)[number]): number {
  switch (signal) {
    case "SIGHUP":
      return 129
    case "SIGINT":
      return 130
    case "SIGTERM":
      return 143
  }
}
