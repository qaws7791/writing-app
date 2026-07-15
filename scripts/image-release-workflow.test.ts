import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const workflow = readFileSync(
  path.join(repositoryRoot, ".github", "workflows", "image-release.yml"),
  "utf8"
)

const actionPins = {
  "actions/attest": "f6bf1532d7d6793fce74eac584813a8eee607999",
  "actions/checkout": "df4cb1c069e1874edd31b4311f1884172cec0e10",
  "actions/download-artifact": "3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c",
  "actions/setup-node": "249970729cb0ef3589644e2896645e5dc5ba9c38",
  "actions/upload-artifact": "b7c566a772e6b6bfb58ed0dc250532a479d7789f",
  "anchore/scan-action": "e1165082ffb1fe366ebaf02d8526e7c4989ea9d2",
  "docker/build-push-action": "53b7df96c91f9c12dcc8a07bcb9ccacbed38856a",
  "docker/login-action": "af1e73f918a031802d376d3c8bbc3fe56130a9b0",
  "docker/metadata-action": "dc802804100637a589fabce1cb79ff13a1411302",
  "docker/setup-buildx-action": "bb05f3f5519dd87d3ba754cc423b652a5edd6d2c",
  "oven-sh/setup-bun": "0c5077e51419868618aeaa5fe8019c62421857d6",
} as const

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

  test("네 image를 GHCR에 SHA와 공개 설정 digest tag로 게시한다", () => {
    for (const [service, dockerfile] of [
      ["web", "deploy/docker/web.dockerfile"],
      ["api", "deploy/docker/api.dockerfile"],
      ["admin", "deploy/docker/admin.dockerfile"],
      ["admin-api", "deploy/docker/admin-api.dockerfile"],
    ] as const) {
      expect(workflow).toContain("service: " + service)
      expect(workflow).toContain("dockerfile: " + dockerfile)
    }

    expect(workflow).toContain("packages: write")
    expect(workflow).toContain(
      `uses: docker/login-action@${actionPins["docker/login-action"]}`
    )
    expect(workflow).toContain(
      `uses: docker/build-push-action@${actionPins["docker/build-push-action"]}`
    )
    expect(workflow).toContain("push: true")
    expect(workflow).toContain("platforms: linux/amd64")
    expect(workflow).toContain(
      "type=raw,value=${{ needs.release-preflight.outputs.release-tag }}"
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

  test("SBOM, provenance, GitHub attestation과 네 digest manifest를 생성한다", () => {
    expect(workflow).toContain("attestations: write")
    expect(workflow).toContain("artifact-metadata: write")
    expect(workflow).toContain("id-token: write")
    expect(workflow).toContain("provenance: mode=max")
    expect(workflow).toContain("sbom: true")
    expect(workflow).toContain(
      `uses: actions/attest@${actionPins["actions/attest"]}`
    )
    expect(workflow).toContain("push-to-registry: true")
    expect(workflow).toContain(
      `uses: actions/download-artifact@${actionPins["actions/download-artifact"]}`
    )
    expect(workflow).toContain(
      "bun scripts/image-release-metadata.ts aggregate"
    )
    expect(workflow).toContain("output/image-release-manifest.json")
  })

  test("각 digest를 고정 Grype로 검사하고 HIGH 이상이면 manifest 생성을 차단한다", () => {
    expect(workflow).toContain(
      `uses: anchore/scan-action@${actionPins["anchore/scan-action"]}`
    )
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
    const record = workflow.indexOf("name: Image digest record 생성")
    expect(build).toBeGreaterThan(-1)
    expect(scan).toBeGreaterThan(build)
    expect(attest).toBeGreaterThan(scan)
    expect(record).toBeGreaterThan(scan)
  })

  test("production 공개 origin을 repository variable로만 전달한다", () => {
    for (const variable of [
      "PRODUCTION_WEB_ORIGIN",
      "PRODUCTION_API_ORIGIN",
      "PRODUCTION_ADMIN_ORIGIN",
      "PRODUCTION_ADMIN_API_ORIGIN",
    ]) {
      expect(workflow).toContain("vars." + variable)
    }
    expect(workflow).not.toContain("secrets.PRODUCTION_")
  })

  test("모든 외부 action을 검증된 full commit SHA로 고정한다", () => {
    for (const [action, revision] of Object.entries(actionPins)) {
      expect(workflow).toContain(`uses: ${action}@${revision}`)
    }
    expect(workflow).not.toMatch(/uses: [^\s]+@v\d+/u)
  })
})
