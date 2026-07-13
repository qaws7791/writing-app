import { existsSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { createConnection } from "node:net"
import { tmpdir } from "node:os"
import path from "node:path"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const temporaryDirectory = await mkdtemp(
  path.join(tmpdir(), "writing-app-e2e-")
)
const databaseUrl = path.join(temporaryDirectory, "writing-app.sqlite")
const nextLocks = [
  path.join(repositoryRoot, "apps", "web", ".next", "dev", "lock"),
  path.join(repositoryRoot, "apps", "admin", ".next", "dev", "lock"),
] as const
const ownedPorts = [3100, 3101, 4100, 4101, 4199] as const
let exitCode = 1

try {
  const playwright = Bun.spawn({
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
      ...Bun.argv.slice(2),
    ],
    cwd: repositoryRoot,
    env: {
      ...process.env,
      E2E_DATABASE_URL: databaseUrl,
      E2E_RUN_ROOT: temporaryDirectory,
    },
    stderr: "inherit",
    stdout: "inherit",
    windowsHide: true,
  })

  exitCode = await playwright.exited
  await waitForReleasedResources()
} catch (error) {
  console.error(error)
  exitCode = 1
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true })
}

process.exit(exitCode)

async function waitForReleasedResources(): Promise<void> {
  const deadline = performance.now() + 15_000

  while (performance.now() < deadline) {
    const listeningPorts = await findListeningPorts()
    const existingLocks = nextLocks.filter((lockPath) => existsSync(lockPath))

    if (listeningPorts.length === 0 && existingLocks.length === 0) return
    await Bun.sleep(250)
  }

  const listeningPorts = await findListeningPorts()
  const existingLocks = nextLocks.filter((lockPath) => existsSync(lockPath))
  throw new Error(
    `E2E 종료 후 자원이 남았습니다. ports=${listeningPorts.join(",") || "없음"}, locks=${existingLocks.join(",") || "없음"}`
  )
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
