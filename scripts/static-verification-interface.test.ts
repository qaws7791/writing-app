import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, test } from "bun:test"

interface RootPackageManifest {
  readonly scripts?: {
    readonly lint?: string
  }
}

const repositoryRoot = path.resolve(import.meta.dir, "..")

describe("정적 검증 Interface", () => {
  test("root lint가 로컬과 CI의 필수 검사를 모두 소유한다", () => {
    const manifest = JSON.parse(
      readFileSync(path.join(repositoryRoot, "package.json"), "utf8")
    ) as RootPackageManifest
    const lintScript = manifest.scripts?.lint ?? ""

    expect(lintScript).toContain("check:package-interfaces")
    expect(lintScript).toContain("check:localhost-literals")
    expect(lintScript).toContain("oxlint apps packages scripts --deny-warnings")
  })

  test("CI 정적 검증은 root 명령을 다시 정의하지 않는다", () => {
    const workflow = readFileSync(
      path.join(repositoryRoot, ".github", "workflows", "quality-gates.yml"),
      "utf8"
    )
    const staticChecks = workflow.slice(
      workflow.indexOf("  static-checks:"),
      workflow.indexOf("  tests:")
    )

    expect(staticChecks).toContain("- run: bun run lint")
    expect(staticChecks).toContain("- run: bun run format:check")
    expect(staticChecks).toContain("- run: bun run typecheck")
    expect(staticChecks).not.toContain("- run: bun run check:")
    expect(staticChecks).not.toContain("bunx oxlint")
  })

  test("document drift는 별도 workflow에서 중복 실행하지 않는다", () => {
    expect(
      existsSync(
        path.join(repositoryRoot, ".github", "workflows", "document-drift.yml")
      )
    ).toBe(false)
  })
})
