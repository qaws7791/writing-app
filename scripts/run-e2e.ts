import { existsSync } from "node:fs"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { createConnection } from "node:net"
import { tmpdir } from "node:os"
import path from "node:path"

import {
  type E2eServerDefinition,
  type StartedE2eServer,
  startE2eServers,
  stopE2eProcess,
  stopE2eServers,
} from "#scripts/e2e-server-lifecycle"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const temporaryDirectory = await mkdtemp(
  path.join(tmpdir(), "writing-app-e2e-")
)
const databaseUrl = path.join(temporaryDirectory, "writing-app.sqlite")
const nextLocks = [
  path.join(repositoryRoot, "apps", "web", ".next", "dev", "lock"),
  path.join(repositoryRoot, "apps", "admin", ".next", "dev", "lock"),
] as const
const ownedPorts = [3100, 3101, 4100, 4199] as const
let exitCode = 1
let resourcesReserved = false
let servers: readonly StartedE2eServer[] = []
let runnerArguments: E2eRunnerArguments = {
  playwrightArguments: [],
  runtime: "development",
  serverScope: "all",
}
let playwright: Bun.Subprocess<"ignore", "inherit", "inherit"> | undefined
let cleanupPromise: Promise<void> | undefined
let shutdownSignal: ShutdownSignal | undefined

const shutdownSignals = ["SIGINT", "SIGTERM", "SIGHUP"] as const
type ShutdownSignal = (typeof shutdownSignals)[number]
const signalHandlers = shutdownSignals.map((signal) => ({
  handler: () => requestSignalShutdown(signal),
  signal,
}))

for (const { handler, signal } of signalHandlers) {
  process.on(signal, handler)
}

try {
  runnerArguments = readRunnerArguments(Bun.argv.slice(2))
  await assertOwnedResourcesAreAvailable()
  resourcesReserved = true
  servers = await startE2eServers(
    createE2eServerDefinitions(
      databaseUrl,
      temporaryDirectory,
      runnerArguments.serverScope,
      runnerArguments.runtime
    ),
    {
      onServerStarted(server) {
        servers = [...servers, server]
      },
    }
  )

  playwright = Bun.spawn({
    cmd: [
      "node",
      path.join(
        repositoryRoot,
        "node_modules",
        "@playwright",
        "test",
        "cli.js"
      ),
      "test",
      ...runnerArguments.playwrightArguments,
    ],
    cwd: repositoryRoot,
    env: {
      ...process.env,
      E2E_DATABASE_URL: databaseUrl,
      E2E_RUN_ROOT: temporaryDirectory,
    },
    detached: process.platform !== "win32",
    stderr: "inherit",
    stdin: "ignore",
    stdout: "inherit",
    windowsHide: true,
  })

  exitCode = await playwright.exited
} catch (error) {
  console.error(error)
  exitCode = 1
} finally {
  try {
    await cleanupE2eResources()
  } catch (error) {
    console.error(error)
    exitCode = 1
  }
  for (const { handler, signal } of signalHandlers) {
    process.off(signal, handler)
  }
}

process.exit(exitCode)

function requestSignalShutdown(signal: ShutdownSignal): void {
  if (shutdownSignal !== undefined) return

  shutdownSignal = signal
  void (async () => {
    try {
      await cleanupE2eResources()
    } catch (error) {
      console.error(error)
    }

    process.exit(signalExitCode(signal))
  })()
}

function signalExitCode(signal: ShutdownSignal): number {
  switch (signal) {
    case "SIGHUP":
      return 129
    case "SIGINT":
      return 130
    case "SIGTERM":
      return 143
  }
}

function cleanupE2eResources(): Promise<void> {
  if (cleanupPromise === undefined) cleanupPromise = releaseE2eResources()

  return cleanupPromise
}

async function releaseE2eResources(): Promise<void> {
  const errors: unknown[] = []

  if (playwright !== undefined) {
    try {
      await stopE2eProcess(playwright, "Playwright")
    } catch (error) {
      errors.push(error)
    }
  }

  try {
    await stopE2eServers(servers)
  } catch (error) {
    errors.push(error)
  }

  if (resourcesReserved) {
    try {
      await waitForReleasedResources()
    } catch (error) {
      errors.push(error)
    }
  }

  await rm(temporaryDirectory, { force: true, recursive: true })

  if (errors.length > 0) {
    throw new Error(
      `E2E 자원 정리에 실패했습니다. ${errors.map(String).join("\n")}`
    )
  }
}

function createE2eServerDefinitions(
  e2eDatabaseUrl: string,
  e2eRunRoot: string,
  serverScope: E2eServerScope,
  runtime: E2eRuntime
): readonly E2eServerDefinition[] {
  const environment = {
    ...process.env,
    E2E_DATABASE_URL: e2eDatabaseUrl,
    E2E_RUN_ROOT: e2eRunRoot,
  }
  const webDirectory = path.join(repositoryRoot, "apps", "web")
  const adminDirectory = path.join(repositoryRoot, "apps", "admin")
  const learnerServers: readonly E2eServerDefinition[] = [
    {
      command: [process.execPath, "e2e/fixture-server.ts"],
      cwd: repositoryRoot,
      env: environment,
      name: "fixture",
      readinessUrl: "http://127.0.0.1:4199",
    },
    {
      command: [process.execPath, "apps/api/src/scripts/start-e2e-api.ts"],
      cwd: repositoryRoot,
      env: {
        ...environment,
        ADMIN_AUTH_SECRET: "e2e-admin-auth-secret-must-have-32-characters",
        ADMIN_ORIGIN: "http://127.0.0.1:3101",
        API_PORT: "4100",
        DATABASE_URL: e2eDatabaseUrl,
        GOOGLE_CLIENT_ID: "e2e-google-client.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "e2e-google-client-secret",
        LEARNER_AUTH_SECRET: "e2e-auth-secret-must-have-32-characters",
        NODE_ENV: "test",
        WEB_ORIGIN: "http://localhost:3100",
      },
      name: "api",
      readinessUrl: "http://127.0.0.1:4100/api/health",
    },
    {
      command:
        runtime === "standalone"
          ? [
              process.execPath,
              path.join(repositoryRoot, "scripts", "run-next-standalone.mjs"),
              "web",
            ]
          : [
              process.execPath,
              path.join(
                webDirectory,
                "node_modules",
                "next",
                "dist",
                "bin",
                "next"
              ),
              "dev",
              "--hostname",
              "localhost",
              "--port",
              "3100",
            ],
      cwd: runtime === "standalone" ? repositoryRoot : webDirectory,
      env: {
        ...environment,
        API_BASE_URL: "http://127.0.0.1:4100",
        CONTENT_ASSET_PUBLIC_BASE_URL:
          runtime === "standalone"
            ? undefined
            : "http://127.0.0.1:4199/content-assets",
        HOSTNAME: "localhost",
        NODE_ENV: runtime === "standalone" ? "production" : undefined,
        PORT: "3100",
        WEB_ORIGIN: "http://localhost:3100",
      },
      name: "learner web",
      readinessUrl: "http://localhost:3100/login",
    },
  ]

  if (serverScope === "learner") return learnerServers

  return [
    ...learnerServers,
    {
      command:
        runtime === "standalone"
          ? [
              process.execPath,
              path.join(repositoryRoot, "scripts", "run-next-standalone.mjs"),
              "admin",
            ]
          : [
              process.execPath,
              path.join(
                adminDirectory,
                "node_modules",
                "next",
                "dist",
                "bin",
                "next"
              ),
              "dev",
              "--hostname",
              "127.0.0.1",
              "--port",
              "3101",
            ],
      cwd: runtime === "standalone" ? repositoryRoot : adminDirectory,
      env: {
        ...environment,
        API_BASE_URL: "http://127.0.0.1:4100",
        ADMIN_ORIGIN: "http://127.0.0.1:3101",
        CONTENT_ASSET_PUBLIC_BASE_URL:
          runtime === "standalone"
            ? undefined
            : "http://127.0.0.1:4199/content-assets",
        HOSTNAME: "127.0.0.1",
        NEXT_PUBLIC_LEARNER_WEB_ORIGIN: "http://localhost:3100",
        NODE_ENV: runtime === "standalone" ? "production" : undefined,
        PORT: "3101",
      },
      name: "admin web",
      readinessUrl: "http://127.0.0.1:3101/login",
    },
  ]
}

type E2eServerScope = "all" | "learner"
type E2eRuntime = "development" | "standalone"

interface E2eRunnerArguments {
  readonly playwrightArguments: readonly string[]
  readonly runtime: E2eRuntime
  readonly serverScope: E2eServerScope
}

function readRunnerArguments(
  argumentsToParse: readonly string[]
): E2eRunnerArguments {
  const playwrightArguments: string[] = []
  let runtime: E2eRuntime = "development"
  let serverScope: E2eServerScope = "all"

  for (let index = 0; index < argumentsToParse.length; index += 1) {
    const argument = argumentsToParse[index]

    if (argument === "--runtime") {
      const requestedRuntime = argumentsToParse[index + 1]

      if (
        requestedRuntime !== "development" &&
        requestedRuntime !== "standalone"
      ) {
        throw new Error(
          "--runtime 값은 development 또는 standalone이어야 합니다."
        )
      }

      runtime = requestedRuntime
      index += 1
      continue
    }

    if (argument !== "--server-scope") {
      playwrightArguments.push(argument)
      continue
    }

    const requestedScope = argumentsToParse[index + 1]

    if (requestedScope !== "all" && requestedScope !== "learner") {
      throw new Error("--server-scope 값은 all 또는 learner여야 합니다.")
    }

    serverScope = requestedScope
    index += 1
  }

  return { playwrightArguments, runtime, serverScope }
}

async function waitForReleasedResources(): Promise<void> {
  const deadline = performance.now() + 15_000

  while (performance.now() < deadline) {
    const listeningPorts = await findListeningPorts()
    const existingLocks = await removeStaleNextLocks()

    if (listeningPorts.length === 0 && existingLocks.length === 0) return
    await Bun.sleep(250)
  }

  const listeningPorts = await findListeningPorts()
  const existingLocks = await removeStaleNextLocks()
  throw new Error(
    `E2E 종료 후 자원이 남았습니다. ports=${listeningPorts.join(",") || "없음"}, locks=${existingLocks.join(",") || "없음"}`
  )
}

async function assertOwnedResourcesAreAvailable(): Promise<void> {
  const listeningPorts = await findListeningPorts()
  const existingLocks = await removeStaleNextLocks()

  if (listeningPorts.length === 0 && existingLocks.length === 0) return

  throw new Error(
    `E2E 시작 전 소유 자원이 사용 중입니다. ports=${listeningPorts.join(",") || "없음"}, locks=${existingLocks.join(",") || "없음"}`
  )
}

async function removeStaleNextLocks(): Promise<readonly string[]> {
  await Promise.all(
    nextLocks.map(async (lockPath) => {
      const processId = await readNextDevLockProcessId(lockPath)

      if (processId !== undefined && !isProcessAlive(processId)) {
        await rm(lockPath, { force: true })
      }
    })
  )

  return nextLocks.filter((lockPath) => existsSync(lockPath))
}

async function readNextDevLockProcessId(
  lockPath: string
): Promise<number | undefined> {
  if (!existsSync(lockPath)) return undefined

  try {
    const parsed: unknown = JSON.parse(await readFile(lockPath, "utf8"))

    return isNextDevLock(parsed) ? parsed.pid : undefined
  } catch {
    return undefined
  }
}

function isNextDevLock(value: unknown): value is { readonly pid: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "pid" in value &&
    typeof value.pid === "number" &&
    Number.isSafeInteger(value.pid) &&
    value.pid > 0
  )
}

function isProcessAlive(processId: number): boolean {
  try {
    process.kill(processId, 0)
    return true
  } catch (error) {
    return readErrorCode(error) === "EPERM"
  }
}

function readErrorCode(error: unknown): string | undefined {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : undefined
}

async function findListeningPorts(): Promise<readonly number[]> {
  const results = await Promise.all(
    ownedPorts.map(async (port) => ({
      listening: await isPortListening(port),
      port,
    }))
  )

  return results.filter(({ listening }) => listening).map(({ port }) => port)
}

function isPortListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port })
    const finish = (listening: boolean) => {
      socket.destroy()
      resolve(listening)
    }

    socket.setTimeout(500)
    socket.once("connect", () => finish(true))
    socket.once("error", () => finish(false))
    socket.once("timeout", () => finish(false))
  })
}
