import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, test } from "bun:test"

interface RootPackageManifest {
  readonly scripts?: {
    readonly "check:deployment-ansible"?: string
    readonly "check:deployment-config"?: string
    readonly lint?: string
    readonly "test:deployment-images"?: string
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
      workflow.indexOf("  deployment-config:")
    )

    expect(staticChecks).toContain("- run: bun run lint")
    expect(staticChecks).toContain("- run: bun run format:check")
    expect(staticChecks).toContain("- run: bun run typecheck")
    expect(
      staticChecks.replace("- run: bun run check:toolchain", "")
    ).not.toContain("- run: bun run check:")
    expect(staticChecks).not.toContain("bunx oxlint")
  })

  test("document drift는 별도 workflow에서 중복 실행하지 않는다", () => {
    expect(
      existsSync(
        path.join(repositoryRoot, ".github", "workflows", "document-drift.yml")
      )
    ).toBe(false)
  })

  test("배포 구성 CI는 root의 canonical 검증 명령을 실행한다", () => {
    const manifest = JSON.parse(
      readFileSync(path.join(repositoryRoot, "package.json"), "utf8")
    ) as RootPackageManifest
    const workflow = readFileSync(
      path.join(repositoryRoot, ".github", "workflows", "quality-gates.yml"),
      "utf8"
    )
    const deploymentChecks = workflow.slice(
      workflow.indexOf("  deployment-config:"),
      workflow.indexOf("  deployment-images:")
    )

    expect(manifest.scripts?.["check:deployment-config"]).toBe(
      "bun scripts/check-deployment-config.ts"
    )
    expect(manifest.scripts?.["check:deployment-ansible"]).toBe(
      "bun scripts/check-deployment-ansible.ts"
    )
    expect(deploymentChecks).toContain("- run: bun run check:deployment-config")
    expect(deploymentChecks).toContain(
      "- run: bun run check:deployment-ansible"
    )
    expect(deploymentChecks).toContain(
      "python -m pip install -r infra/ansible/requirements.txt"
    )
    expect(deploymentChecks).toContain(
      "ansible-galaxy collection install -r infra/ansible/requirements.yaml"
    )
  })

  test("production image CI는 root smoke 명령과 Buildx를 사용한다", () => {
    const manifest = JSON.parse(
      readFileSync(path.join(repositoryRoot, "package.json"), "utf8")
    ) as RootPackageManifest
    const workflow = readFileSync(
      path.join(repositoryRoot, ".github", "workflows", "quality-gates.yml"),
      "utf8"
    )
    const imageChecks = workflow.slice(
      workflow.indexOf("  deployment-images:"),
      workflow.indexOf("  tests:")
    )

    expect(manifest.scripts?.["test:deployment-images"]).toBe(
      "bun scripts/test-deployment-images.ts"
    )
    expect(imageChecks).toContain("uses: docker/setup-buildx-action@v3")
    expect(imageChecks).toContain("- run: bun run test:deployment-images")
  })
})
