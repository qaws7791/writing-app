import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

import {
  type ImageVulnerabilityException,
  type ImageVulnerabilityPolicy,
  parseImageVulnerabilityPolicy,
  validateImageVulnerabilityPolicy,
} from "#scripts/image-vulnerability-policy"
import { createDependencyAuditArguments } from "#scripts/run-dependency-audit"

type RootManifest = Readonly<{
  overrides?: Readonly<Record<string, string>>
  scripts?: Readonly<Record<string, string>>
}>

const repositoryRoot = path.resolve(import.meta.dir, "..")
const auditDate = "2026-07-23"
const bunAuditException: ImageVulnerabilityException = {
  checks: ["bun-audit"],
  dependencyPath: "fixture 의존성 경로",
  expiresOn: "2026-12-31",
  mitigation: "fixture 완화 조치",
  owner: "@fixture-owner",
  package: "fixture-package",
  reason: "fixture 유예 근거",
  removalCondition: "fixture 제거 조건",
  services: [],
  vulnerability: "GHSA-2222-3333-4444",
}
const imageScanOnlyException: ImageVulnerabilityException = {
  ...bunAuditException,
  checks: ["image-scan"],
  package: "fixture-image-package",
  services: ["web"],
  vulnerability: "GHSA-5555-6666-7777",
}

describe("dependency audit 인자 생성", () => {
  test("예외가 없으면 범위 flag만 넘기고 ignore 인자를 만들지 않는다", () => {
    const policy = fixturePolicy([])

    expect(createDependencyAuditArguments(policy, "full", auditDate)).toEqual([
      "audit",
      "--audit-level=high",
    ])
    expect(
      createDependencyAuditArguments(policy, "production", auditDate)
    ).toEqual(["audit", "--prod", "--audit-level=high"])
  })

  test("bun-audit 예외만 ignore 인자가 되고 image-scan 전용 예외는 제외한다", () => {
    const policy = fixturePolicy([bunAuditException, imageScanOnlyException])

    expect(createDependencyAuditArguments(policy, "full", auditDate)).toEqual([
      "audit",
      "--audit-level=high",
      `--ignore=${bunAuditException.vulnerability}`,
    ])
  })

  test("만료된 예외는 audit 실행 인자를 만들지 못한다", () => {
    const policy = fixturePolicy([
      { ...bunAuditException, expiresOn: "2026-07-22" },
    ])

    expect(() =>
      createDependencyAuditArguments(policy, "production", auditDate)
    ).toThrow("만료된 예외")
  })
})

describe("저장소 audit 정책", () => {
  test("ignore 목록은 audit script가 아니라 정책 파일이 소유한다", () => {
    const manifest = readJson<RootManifest>("package.json")

    expect(manifest.scripts?.["audit:production"]).not.toContain("--ignore")
    expect(manifest.scripts?.["audit:full"]).not.toContain("--ignore")
  })

  test("sharp를 override로 강제하지 않는다", () => {
    const manifest = readJson<RootManifest>("package.json")

    expect(manifest.overrides?.sharp).toBeUndefined()
  })

  test("정책 파일은 schema를 만족하고 만료된 예외를 남기지 않는다", () => {
    const policy = parseImageVulnerabilityPolicy(
      readJson<unknown>("deploy/security/image-vulnerability-policy.json")
    )

    expect(
      validateImageVulnerabilityPolicy(
        policy,
        new Date().toISOString().slice(0, 10)
      )
    ).toEqual([])
  })
})

function fixturePolicy(
  exceptions: readonly ImageVulnerabilityException[]
): ImageVulnerabilityPolicy {
  return parseImageVulnerabilityPolicy({
    exceptions,
    schemaVersion: 2,
    severityCutoff: "high",
  })
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(path.join(repositoryRoot, relativePath), "utf8")
  ) as T
}
