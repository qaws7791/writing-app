import path from "node:path"

import {
  createLocalSetupEnvironment,
  createLocalEnvironmentFiles,
  hasLocalOnboardingFailures,
  inspectLocalOnboarding,
  prepareLocalDatabaseDirectory,
  printLocalOnboardingChecks,
} from "#scripts/local-onboarding"

const repositoryRoot = path.resolve(import.meta.dir, "..")

async function runSetup(): Promise<void> {
  await runCommand(["bun", "run", "check:toolchain"])
  await runCommand(["bun", "install", "--frozen-lockfile"])

  const files = createLocalEnvironmentFiles({ repositoryRoot })
  for (const file of files) {
    const action =
      file.kind === "created"
        ? "생성"
        : file.kind === "updated"
          ? "보충"
          : "보존"
    console.log(`- ${action}: ${file.path}`)
  }

  const preflight = inspectLocalOnboarding({
    bunVersion: Bun.version,
    nodeVersion: process.versions.node,
    repositoryRoot,
    requireDatabase: false,
  })
  printLocalOnboardingChecks(preflight)
  if (hasLocalOnboardingFailures(preflight)) {
    throw new Error("로컬 환경 사전 점검에 실패했습니다.")
  }

  const setupEnvironment = createLocalSetupEnvironment(
    repositoryRoot,
    process.env
  )
  const databaseDirectory = prepareLocalDatabaseDirectory(
    repositoryRoot,
    setupEnvironment.databaseUrl
  )
  console.log(`- 준비: ${databaseDirectory} database 디렉터리`)

  await runCommand(
    ["bun", "run", "dev:admin:setup"],
    setupEnvironment.processEnvironment
  )
  await runCommand(["bun", "run", "doctor"])

  console.log("로컬 준비가 완료되었습니다. bun run dev를 실행하세요.")
  console.log(
    "관리자 로그인 값은 apps/api/.env의 ADMIN_SEED_EMAIL과 ADMIN_SEED_PASSWORD에서 확인하세요."
  )
}

async function runCommand(
  command: readonly string[],
  environment: Readonly<NodeJS.ProcessEnv> = process.env
): Promise<void> {
  console.log(`\n> ${command.join(" ")}`)
  const child = Bun.spawn(command, {
    cwd: repositoryRoot,
    env: environment,
    stderr: "inherit",
    stdin: "inherit",
    stdout: "inherit",
  })
  const exitCode = await child.exited

  if (exitCode !== 0) {
    throw new Error(`${command.join(" ")} 명령이 실패했습니다.`)
  }
}

if (import.meta.main) {
  try {
    await runSetup()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
