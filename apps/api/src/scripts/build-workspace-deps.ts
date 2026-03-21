import { resolve } from "node:path"

const apiRoot = resolve(import.meta.dir, "../..")
const backendCoreRoot = resolve(apiRoot, "../../packages/backend-core")
const dbRoot = resolve(apiRoot, "../../packages/db")

const runBuild = async (cwd: string) => {
  const childProcess = Bun.spawn({
    cmd: [process.execPath, "run", "build"],
    cwd,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: process.env,
  })

  const exitCode = await childProcess.exited

  if (exitCode !== 0) {
    throw new Error(`Build failed in ${cwd}`)
  }
}

await runBuild(backendCoreRoot)
await runBuild(dbRoot)
