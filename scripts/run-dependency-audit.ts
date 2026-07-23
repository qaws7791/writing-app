import { spawnSync } from "node:child_process"

import {
  type ImageVulnerabilityPolicy,
  readImageVulnerabilityPolicy,
  validateImageVulnerabilityPolicy,
} from "#scripts/image-vulnerability-policy"

export type DependencyAuditScope = "full" | "production"

export function createDependencyAuditArguments(
  policy: ImageVulnerabilityPolicy,
  scope: DependencyAuditScope,
  currentDate: string
): readonly string[] {
  if (scope !== "full" && scope !== "production") {
    throw new Error(`지원하지 않는 dependency audit 범위입니다: ${scope}`)
  }

  const errors = validateImageVulnerabilityPolicy(policy, currentDate)
  if (errors.length > 0) throw new Error(errors.join("\n"))

  const ignoredAdvisories = [
    ...new Set(
      policy.exceptions
        .filter((exception) => exception.checks.includes("bun-audit"))
        .map((exception) => exception.vulnerability)
    ),
  ].sort()

  return [
    "audit",
    ...(scope === "production" ? ["--prod"] : []),
    "--audit-level=high",
    ...ignoredAdvisories.map((advisory) => `--ignore=${advisory}`),
  ]
}

function currentUtcDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function runDependencyAudit(): void {
  const scope = process.argv[2]
  if (scope !== "full" && scope !== "production") {
    throw new Error("full 또는 production audit 범위를 지정해야 합니다.")
  }

  const policy = readImageVulnerabilityPolicy()
  const result = spawnSync(
    process.execPath,
    createDependencyAuditArguments(policy, scope, currentUtcDate()),
    { stdio: "inherit" }
  )
  if (result.error !== undefined) throw result.error
  if (result.status !== 0) process.exitCode = result.status ?? 1
}

if (import.meta.main) {
  try {
    runDependencyAudit()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
