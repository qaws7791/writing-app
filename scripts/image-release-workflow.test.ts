import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const workflow = readFileSync(
  path.join(repositoryRoot, ".github", "workflows", "image-release.yml"),
  "utf8"
)

describe("production image release workflow", () => {
  test("성공한 main push 품질 게이트의 동일 SHA만 release한다", () => {
    expect(workflow).toContain("workflows:\n      - 필수 품질 게이트")
    expect(workflow).toContain(
      "github.event.workflow_run.conclusion == 'success'"
    )
    expect(workflow).toContain("github.event.workflow_run.event == 'push'")
    expect(workflow).toContain(
      "github.event.workflow_run.head_repository.full_name == github.repository"
    )
    expect(workflow).toContain("ref: ${{ github.event.workflow_run.head_sha }}")
    expect(workflow).toContain("persist-credentials: false")
    expect(workflow).not.toContain("workflow_dispatch:")
    expect(workflow).not.toContain("pull_request:")
  })

  test("세 image를 GHCR에 SHA와 공개 설정 digest tag로 게시한다", () => {
    for (const [service, dockerfile] of [
      ["web", "deploy/docker/web.dockerfile"],
      ["api", "deploy/docker/api.dockerfile"],
      ["admin", "deploy/docker/admin.dockerfile"],
    ] as const) {
      expect(workflow).toContain("service: " + service)
      expect(workflow).toContain("dockerfile: " + dockerfile)
    }
    expect(workflow).not.toContain("service: admin-api")

    expect(workflow).toContain("packages: write")
    expect(workflow).toContain("uses: docker/login-action@")
    expect(workflow).toContain("uses: docker/build-push-action@")
    expect(workflow).toContain("push: true")
    expect(workflow).toContain("platforms: linux/amd64")
    expect(workflow).toContain(
      "type=raw,value=candidate-${{ github.event.workflow_run.head_sha }}-${{ github.run_id }}-${{ github.run_attempt }}"
    )
    expect(workflow).toContain(
      "org.opencontainers.image.revision=${{ github.event.workflow_run.head_sha }}"
    )
    expect(workflow).toContain(
      "io.writing-app.configuration-digest=${{ needs.release-preflight.outputs.configuration-digest }}"
    )
    expect(workflow).toContain(
      "io.writing-app.public-origin.web=${{ vars.PRODUCTION_WEB_ORIGIN }}"
    )
    expect(workflow).toContain("io.writing-app.runtime=${{ matrix.runtime }}")
    expect(workflow).not.toMatch(/\blatest\b/u)
  })

  test("SBOM, provenance, GitHub attestation과 세 digest manifest를 생성한다", () => {
    expect(workflow).toContain("attestations: write")
    expect(workflow).toContain("artifact-metadata: write")
    expect(workflow).toContain("id-token: write")
    expect(workflow).toContain("provenance: mode=max")
    expect(workflow).toContain("sbom: true")
    expect(workflow).toContain("uses: actions/attest@")
    expect(workflow).toContain("push-to-registry: true")
    expect(workflow).toContain("uses: actions/download-artifact@")
    expect(workflow).toContain(
      "bun scripts/image-release-metadata.ts aggregate"
    )
    expect(workflow).toContain("output/image-release-manifest.json")
  })

  test("각 digest를 고정 Grype로 검사하고 HIGH 이상이면 manifest 생성을 차단한다", () => {
    expect(workflow).toContain("uses: anchore/scan-action@")
    expect(workflow).toContain("grype-version: v0.110.0")
    expect(workflow).toContain(
      "severity-cutoff: ${{ needs.release-preflight.outputs.vulnerability-severity-cutoff }}"
    )
    expect(workflow).toContain("only-fixed: false")
    expect(workflow).toContain("fail-build: true")
    expect(workflow).toContain(
      "if: ${{ always() && steps.build.outcome == 'success' }}"
    )
    expect(workflow).toContain("image-vulnerability-report-")

    const build = workflow.indexOf("id: build")
    const scan = workflow.indexOf("id: vulnerability-scan")
    const attest = workflow.indexOf("name: GitHub artifact attestation 게시")
    const promote = workflow.indexOf(
      "name: 검사 통과 digest를 release tag로 승격"
    )
    const record = workflow.indexOf("name: Image digest record 생성")
    expect(build).toBeGreaterThan(-1)
    expect(scan).toBeGreaterThan(build)
    expect(attest).toBeGreaterThan(scan)
    expect(promote).toBeGreaterThan(scan)
    expect(attest).toBeGreaterThan(promote)
    expect(record).toBeGreaterThan(scan)
  })

  test("production 공개 origin을 repository variable로만 전달한다", () => {
    for (const variable of [
      "PRODUCTION_WEB_ORIGIN",
      "PRODUCTION_ADMIN_ORIGIN",
    ]) {
      expect(workflow).toContain("vars." + variable)
    }
    expect(workflow).not.toContain("secrets.PRODUCTION_")
  })

  test("모든 외부 action을 검증된 full commit SHA로 고정한다", () => {
    const actionReferences = [
      ...workflow.matchAll(/^\s*uses:\s+([^\s#]+)/gmu),
    ].map((match) => match[1])

    expect(actionReferences.length).toBeGreaterThan(0)
    for (const reference of actionReferences) {
      expect(reference).toMatch(/^[^@]+@[0-9a-f]{40}$/u)
    }
  })
})
