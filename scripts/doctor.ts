import path from "node:path"

import {
  applyEnvironmentOverrides,
  inspectLocalEnvironmentFiles,
  readLocalApiEnvironment,
} from "#scripts/local-environment"
import { requireLocalToolchain } from "#scripts/local-toolchain"

const repositoryRoot = path.resolve(import.meta.dir, "..")

async function runDoctor(): Promise<void> {
  const toolchain = requireLocalToolchain(repositoryRoot)
  const environmentIssues = inspectLocalEnvironmentFiles(repositoryRoot)
  if (environmentIssues.length > 0) {
    throw new Error(
      `로컬 환경 파일 진단에 실패했습니다.\n${environmentIssues.map((issue) => `- ${issue}`).join("\n")}\n- bun run setup을 실행하세요.`
    )
  }

  const apiEnvironment = applyEnvironmentOverrides(
    readLocalApiEnvironment(repositoryRoot),
    process.env
  )
  await run(
    [
      "bun",
      "--env-file=apps/api/.env",
      "apps/api/src/scripts/check-environment.ts",
    ],
    apiEnvironment
  )
  await run(
    ["bun", "--filter", "@workspace/api", "db:inspect"],
    apiEnvironment,
    "로컬 DB schema 또는 무결성 진단에 실패했습니다."
  )

  console.log(
    `✓ Git ${toolchain.gitVersion}, Bun ${toolchain.bunVersion}, Node.js ${toolchain.nodeVersion}`
  )
  console.log("로컬 개발 환경 진단을 통과했습니다.")
}

async function run(
  command: readonly string[],
  environment: Readonly<Record<string, string>>,
  failureMessage = `${command.join(" ")} 명령이 실패했습니다.`
): Promise<void> {
  const child = Bun.spawn([...command], {
    cwd: repositoryRoot,
    env: { ...process.env, ...environment },
    stderr: "inherit",
    stdin: "inherit",
    stdout: "inherit",
  })
  if ((await child.exited) !== 0) throw new Error(failureMessage)
}

if (import.meta.main) {
  try {
    await runDoctor()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
