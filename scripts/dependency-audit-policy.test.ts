import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

import { parseImageVulnerabilityPolicy } from "#scripts/image-vulnerability-policy"
import { createDependencyAuditArguments } from "#scripts/run-dependency-audit"

type RootManifest = Readonly<{
  catalog?: Readonly<Record<string, string>>
  overrides?: Readonly<Record<string, string>>
  scripts?: Readonly<Record<string, string>>
}>

type PackageManifest = Readonly<{
  dependencies?: Readonly<Record<string, string>>
}>

const repositoryRoot = path.resolve(import.meta.dir, "..")

describe("dependency audit 정책", () => {
  test("audit 명령은 검증된 실행 가능 정책만 사용한다", () => {
    const manifest = readJson<RootManifest>("package.json")
    const policy = parseImageVulnerabilityPolicy(
      readJson<unknown>("deploy/security/image-vulnerability-policy.json")
    )

    expect(manifest.scripts?.["audit:production"]).toBe(
      "bun scripts/run-dependency-audit.ts production"
    )
    expect(manifest.scripts?.["audit:full"]).toBe(
      "bun scripts/run-dependency-audit.ts full"
    )
    expect(manifest.scripts?.["audit:production"]).not.toContain("--ignore")
    expect(manifest.scripts?.["audit:full"]).not.toContain("--ignore")
    expect(
      createDependencyAuditArguments(policy, "full", "2026-07-23")
    ).toEqual(["audit", "--audit-level=high", "--ignore=GHSA-f88m-g3jw-g9cj"])
    expect(
      createDependencyAuditArguments(policy, "production", "2026-07-23")
    ).toEqual([
      "audit",
      "--prod",
      "--audit-level=high",
      "--ignore=GHSA-f88m-g3jw-g9cj",
    ])
  })

  test("sharp는 Next.js 지원 범위에 두고 만료 가능한 완화 근거를 강제한다", () => {
    const manifest = readJson<RootManifest>("package.json")
    const webManifest = readJson<PackageManifest>("apps/web/package.json")
    const adminManifest = readJson<PackageManifest>("apps/admin/package.json")
    const policy = parseImageVulnerabilityPolicy(
      readJson<unknown>("deploy/security/image-vulnerability-policy.json")
    )
    const exception = policy.exceptions.find(
      (candidate) => candidate.vulnerability === "GHSA-f88m-g3jw-g9cj"
    )

    expect(manifest.overrides).toMatchObject({ "fast-uri": "3.1.4" })
    expect(manifest.overrides?.sharp).toBeUndefined()
    expect(manifest.catalog?.sharp).toBe("0.34.5")
    expect(webManifest.dependencies?.sharp).toBe("catalog:")
    expect(adminManifest.dependencies?.sharp).toBe("catalog:")
    expect(exception).toMatchObject({
      checks: ["bun-audit", "image-scan"],
      expiresOn: "2026-08-06",
      owner: "@qaws7791",
      package: "sharp",
      services: ["web", "admin"],
    })
    expect(exception?.dependencyPath.length).toBeGreaterThanOrEqual(20)
    expect(exception?.mitigation.length).toBeGreaterThanOrEqual(20)
    expect(exception?.removalCondition.length).toBeGreaterThanOrEqual(20)
  })

  test("만료된 예외는 audit 실행 인자를 만들지 못한다", () => {
    const policy = parseImageVulnerabilityPolicy(
      readJson<unknown>("deploy/security/image-vulnerability-policy.json")
    )

    expect(() =>
      createDependencyAuditArguments(policy, "production", "2026-08-07")
    ).toThrow("만료된 예외")
  })
})

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(path.join(repositoryRoot, relativePath), "utf8")
  ) as T
}
