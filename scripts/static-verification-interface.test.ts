import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, test } from "bun:test"

interface RootPackageManifest {
  readonly scripts?: {
    readonly "check:deployment-ansible"?: string
    readonly "check:deployment-config"?: string
    readonly lint?: string
    readonly "test:deployment-bootstrap"?: string
    readonly "test:deployment-images"?: string
  }
}

const repositoryRoot = path.resolve(import.meta.dir, "..")

const qualityGatesNode24ActionReferences = [
  "actions/cache@caa296126883cff596d87d8935842f9db880ef25 # v5",
  "actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10 # v6",
  "actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6",
  "actions/setup-python@ece7cb06caefa5fff74198d8649806c4678c61a1 # v6",
  "actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f # v6",
  "docker/setup-buildx-action@bb05f3f5519dd87d3ba754cc423b652a5edd6d2c # v4",
  "oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2",
] as const

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
    expect(manifest.scripts?.["test:deployment-bootstrap"]).toBe(
      "bun scripts/test-deployment-bootstrap.ts"
    )
    expect(deploymentChecks).toContain("runs-on: ubuntu-24.04")
    expect(deploymentChecks).toContain(
      "- run: bun run test:deployment-bootstrap"
    )
    expect(deploymentChecks).toContain('WRITING_APP_DISPOSABLE_UBUNTU: "true"')
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
    expect(imageChecks).toContain(
      "uses: docker/setup-buildx-action@bb05f3f5519dd87d3ba754cc423b652a5edd6d2c # v4"
    )
    expect(imageChecks).toContain("- run: bun run test:deployment-images")
  })

  test("quality gate 외부 action은 Node.js 24 runtime full SHA를 사용한다", () => {
    const workflow = readFileSync(
      path.join(repositoryRoot, ".github", "workflows", "quality-gates.yml"),
      "utf8"
    )

    for (const actionReference of qualityGatesNode24ActionReferences) {
      expect(workflow).toContain(`uses: ${actionReference}`)
    }
    expect(workflow).not.toMatch(/uses:\s+[^\s]+@v\d+/u)
  })

  test("모든 source 경로가 필수 gate를 실행하고 2단계 workspace cache와 Storybook artifact를 보존한다", () => {
    const workflow = readFileSync(
      path.join(repositoryRoot, ".github", "workflows", "quality-gates.yml"),
      "utf8"
    )

    expect(workflow).toContain("pull_request:")
    expect(workflow).toContain("push:\n    branches:\n      - main")
    expect(workflow).not.toMatch(/^\s+paths(?:-ignore)?:/mu)
    expect(workflow).toContain("'packages/*/*/package.json'")
    for (const command of [
      "bun run lint",
      "bun run format:check",
      "bun run typecheck",
      "bun run test -- --summarize --continue=always",
      "bun run build",
    ]) {
      expect(workflow).toContain(command)
    }
    expect(workflow).toContain("name: storybook-static-${{ github.sha }}")
    expect(workflow).toContain("path: apps/storybook/dist/")
    expect(workflow).toContain("retention-days: 14")
  })
})
