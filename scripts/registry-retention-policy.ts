import fs from "node:fs"
import path from "node:path"

type JsonObject = Record<string, unknown>

export interface RegistryRetentionPolicy {
  readonly automaticDeletion: false
  readonly candidateMinimumAgeDays: number
  readonly candidateTagPrefix: "candidate-"
  readonly deleteUntagged: false
  readonly releaseTagPrefix: "sha-"
  readonly schemaVersion: 1
}

export interface RegistryPackageVersion {
  readonly createdAt: string
  readonly id: number
  readonly packageName: string
  readonly tags: readonly string[]
}

export function parseRegistryRetentionPolicy(
  input: unknown
): RegistryRetentionPolicy {
  if (!isObject(input)) throw new Error("registry 보존 정책은 객체여야 합니다.")
  if (
    input.schemaVersion !== 1 ||
    input.candidateTagPrefix !== "candidate-" ||
    input.releaseTagPrefix !== "sha-" ||
    input.deleteUntagged !== false ||
    input.automaticDeletion !== false ||
    !Number.isInteger(input.candidateMinimumAgeDays) ||
    (input.candidateMinimumAgeDays as number) < 7
  ) {
    throw new Error(
      "registry 정책은 7일 이상 candidate-only 보존과 release·untagged 자동 삭제 금지를 유지해야 합니다."
    )
  }
  return {
    automaticDeletion: false,
    candidateMinimumAgeDays: Number(input.candidateMinimumAgeDays),
    candidateTagPrefix: "candidate-",
    deleteUntagged: false,
    releaseTagPrefix: "sha-",
    schemaVersion: 1,
  }
}

export function selectRegistryCleanupCandidates(
  policy: RegistryRetentionPolicy,
  versions: readonly RegistryPackageVersion[],
  currentTime: Date
): readonly RegistryPackageVersion[] {
  const cutoff =
    currentTime.getTime() - policy.candidateMinimumAgeDays * 24 * 60 * 60 * 1000
  return versions.filter((version) => {
    if (version.tags.length === 0) return false
    if (
      !version.tags.every((tag) => tag.startsWith(policy.candidateTagPrefix))
    ) {
      return false
    }
    const createdAt = Date.parse(version.createdAt)
    return Number.isFinite(createdAt) && createdAt < cutoff
  })
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function runRegistryRetentionPolicyCheck(): void {
  const policyFile = path.resolve(
    import.meta.dir,
    "..",
    "deploy",
    "security",
    "registry-retention-policy.json"
  )
  const policy = parseRegistryRetentionPolicy(
    JSON.parse(fs.readFileSync(policyFile, "utf8")) as unknown
  )
  console.log(
    `Registry 정책을 확인했습니다. candidate-only ${policy.candidateMinimumAgeDays}일 보존, 자동 삭제 비활성화.`
  )
}

if (import.meta.main) runRegistryRetentionPolicyCheck()
