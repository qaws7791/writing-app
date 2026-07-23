import path from "node:path"

import { inspectLocalApplicationDatabase } from "#scripts/local-database-diagnostic"
import {
  createLocalSetupEnvironment,
  hasLocalOnboardingFailures,
  inspectLocalOnboarding,
  printLocalOnboardingChecks,
} from "#scripts/local-onboarding"

const repositoryRoot = path.resolve(import.meta.dir, "..")

async function runDoctor(): Promise<void> {
  const checks = inspectLocalOnboarding({
    bunVersion: Bun.version,
    nodeVersion: process.versions.node,
    repositoryRoot,
  })
  printLocalOnboardingChecks(checks)
  if (hasLocalOnboardingFailures(checks)) {
    throw new Error("로컬 환경 진단에 실패했습니다.")
  }

  const setupEnvironment = createLocalSetupEnvironment(
    repositoryRoot,
    process.env
  )
  const diagnostic = await inspectLocalApplicationDatabase({
    environment: setupEnvironment.processEnvironment,
    repositoryRoot,
  })
  if (diagnostic.status === "migration-required") {
    const schema =
      diagnostic.schema === "legacy"
        ? `legacy/${diagnostic.legacySchema}`
        : diagnostic.schema
    throw new Error(
      `DB schema ${schema}에 migration이 필요합니다. bun run setup을 실행하세요.`
    )
  }
  if (diagnostic.status === "blocked") {
    throw new Error(`DB schema 진단이 차단되었습니다: ${diagnostic.reason}`)
  }

  console.log("✓ DB schema: current schema와 무결성 검사를 통과했습니다.")
  console.log("로컬 개발 환경 진단을 통과했습니다.")
}

if (import.meta.main) {
  try {
    await runDoctor()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
