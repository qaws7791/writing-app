import { describe, expect, test } from "bun:test"

import {
  type RegistryPackageVersion,
  parseRegistryRetentionPolicy,
  selectRegistryCleanupCandidates,
} from "./registry-retention-policy"

const policy = parseRegistryRetentionPolicy({
  automaticDeletion: false,
  candidateMinimumAgeDays: 7,
  candidateTagPrefix: "candidate-",
  deleteUntagged: false,
  releaseTagPrefix: "sha-",
  schemaVersion: 1,
})

describe("registry retention policy", () => {
  test("7일이 지난 candidate-only version만 정리 대상으로 선택한다", () => {
    const versions: RegistryPackageVersion[] = [
      version(1, ["candidate-a"], "2026-07-01T00:00:00Z"),
      version(2, ["candidate-b"], "2026-07-15T00:00:00Z"),
      version(3, ["candidate-c", "sha-release"], "2026-07-01T00:00:00Z"),
      version(4, [], "2026-07-01T00:00:00Z"),
    ]

    expect(
      selectRegistryCleanupCandidates(
        policy,
        versions,
        new Date("2026-07-16T00:00:00Z")
      ).map((entry) => entry.id)
    ).toEqual([1])
  })

  test("release, untagged와 자동 삭제를 허용하는 약한 정책을 거부한다", () => {
    for (const override of [
      { automaticDeletion: true },
      { deleteUntagged: true },
      { candidateMinimumAgeDays: 6 },
    ]) {
      expect(() =>
        parseRegistryRetentionPolicy({ ...policy, ...override })
      ).toThrow("자동 삭제 금지")
    }
  })
})

function version(
  id: number,
  tags: readonly string[],
  createdAt: string
): RegistryPackageVersion {
  return { createdAt, id, packageName: "writing-app-web", tags }
}
