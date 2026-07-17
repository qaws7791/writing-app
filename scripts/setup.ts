import path from "node:path"

import {
  createLocalEnvironmentFiles,
  hasLocalOnboardingFailures,
  inspectLocalOnboarding,
  printLocalOnboardingChecks,
} from "#scripts/local-onboarding"

const repositoryRoot = path.resolve(import.meta.dir, "..")

async function runSetup(): Promise<void> {
  await runCommand(["bun", "run", "check:toolchain"])
  await runCommand(["bun", "install", "--frozen-lockfile"])

  const files = createLocalEnvironmentFiles({ repositoryRoot })
  for (const file of files) {
    const action = file.kind === "created" ? "생성" : "보존"
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

  await runCommand(["bun", "run", "dev:admin:setup"])
  await runCommand(["bun", "run", "doctor"])

  console.log("로컬 준비가 완료되었습니다. bun run dev를 실행하세요.")
  console.log(
    "관리자 로그인 값은 apps/api/.env의 ADMIN_SEED_EMAIL과 ADMIN_SEED_PASSWORD에서 확인하세요."
  )
}

async function runCommand(command: readonly string[]): Promise<void> {
  console.log(`\n> ${command.join(" ")}`)
  const child = Bun.spawn(command, {
    cwd: repositoryRoot,
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
