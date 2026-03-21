import { resolve } from "node:path"

const apiRoot = resolve(import.meta.dir, "../..")
const backendCoreRoot = resolve(apiRoot, "../../packages/backend-core")
const dbRoot = resolve(apiRoot, "../../packages/db")

const childProcesses = new Set<Bun.Subprocess>()

const spawnProcess = (
  cwd: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env
) => {
  const childProcess = Bun.spawn({
    cmd: [process.execPath, ...args],
    cwd,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env,
  })

  childProcesses.add(childProcess)

  childProcess.exited.finally(() => {
    childProcesses.delete(childProcess)
  })

  return childProcess
}

const runProcess = async (cwd: string, ...args: string[]) => {
  const childProcess = spawnProcess(cwd, args)
  const exitCode = await childProcess.exited

  if (exitCode !== 0) {
    throw new Error(`Command failed: ${args.join(" ")}`)
  }
}

const stopChildProcesses = () => {
  for (const childProcess of childProcesses) {
    childProcess.kill()
  }
}

process.on("SIGINT", () => {
  stopChildProcesses()
  process.exit(0)
})

process.on("SIGTERM", () => {
  stopChildProcesses()
  process.exit(0)
})

await runProcess(backendCoreRoot, "run", "build")
await runProcess(dbRoot, "run", "build")
await runProcess(apiRoot, "run", "src/scripts/sync-workspace-deps.ts")

const backgroundProcesses = [
  spawnProcess(backendCoreRoot, ["run", "dev"]),
  spawnProcess(dbRoot, ["run", "dev"]),
  spawnProcess(apiRoot, ["run", "src/scripts/sync-workspace-deps.ts"], {
    ...process.env,
    WORKSPACE_DEPS_WATCH: "1",
  }),
  spawnProcess(apiRoot, ["run", "dev:server"]),
]

const [exitCode] = await Promise.race(
  backgroundProcesses.map(
    async (childProcess): Promise<[number, Bun.Subprocess]> => [
      await childProcess.exited,
      childProcess,
    ]
  )
)

stopChildProcesses()
process.exit(exitCode)
