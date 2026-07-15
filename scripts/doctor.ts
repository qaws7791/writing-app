import path from "node:path"

import {
  hasLocalOnboardingFailures,
  inspectLocalOnboarding,
  printLocalOnboardingChecks,
} from "#scripts/local-onboarding"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const checks = inspectLocalOnboarding({
  bunVersion: Bun.version,
  nodeVersion: process.versions.node,
  repositoryRoot,
})

printLocalOnboardingChecks(checks)

if (hasLocalOnboardingFailures(checks)) {
  process.exit(1)
}

console.log("로컬 개발 환경 진단을 통과했습니다.")
