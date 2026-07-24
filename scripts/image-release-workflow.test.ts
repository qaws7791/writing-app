import { describe, expect, test } from "bun:test"
import { readdir } from "node:fs/promises"
import path from "node:path"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const workflowDirectory = path.join(repositoryRoot, ".github", "workflows")
const workflow = await readWorkflow("image-release.yml")

describe("production image release workflow", () => {
  test("성공한 main push 품질 gate의 동일 SHA만 release 대상으로 승인한다", () => {
    const trigger = readObject(workflow.on.workflow_run, "workflow_run trigger")

    expect(new Set(readStringArray(trigger.workflows))).toEqual(
      new Set(["필수 품질 게이트"])
    )
    expect(new Set(readStringArray(trigger.types))).toEqual(
      new Set(["completed"])
    )
    expect(new Set(readStringArray(trigger.branches))).toEqual(
      new Set(["main"])
    )
    expect(workflow.on).not.toHaveProperty("workflow_dispatch")
    expect(workflow.on).not.toHaveProperty("pull_request")

    const preflight = readJob(workflow, "release-preflight")
    expect(new Set(preflight.if?.split(/\s*&&\s*/u))).toEqual(
      new Set([
        "github.event.workflow_run.conclusion == 'success'",
        "github.event.workflow_run.event == 'push'",
        "github.event.workflow_run.head_branch == 'main'",
        "github.event.workflow_run.head_repository.full_name == github.repository",
      ])
    )

    for (const job of Object.values(workflow.jobs)) {
      const checkout = findStepByAction(job, "actions/checkout")
      expect(checkout.with).toMatchObject({
        "persist-credentials": false,
        ref: "${{ github.event.workflow_run.head_sha }}",
      })
    }
  })

  test("web, api, admin image를 immutable digest와 고정 linux platform으로 발행한다", () => {
    const release = readJob(workflow, "release-images")
    const matrix = readObject(
      readObject(release.strategy, "release strategy").matrix,
      "release matrix"
    )
    const targets = readObjectArray(matrix.include)

    expect(
      new Map(
        targets.map((target) => [
          readString(target.service),
          readString(target.dockerfile),
        ])
      )
    ).toEqual(
      new Map([
        ["web", "deploy/docker/web.dockerfile"],
        ["api", "deploy/docker/api.dockerfile"],
        ["admin", "deploy/docker/admin.dockerfile"],
      ])
    )
    expect(release.permissions).toMatchObject({ packages: "write" })

    const build = findStepById(release, "build")
    expect(build.with).toMatchObject({
      file: "${{ matrix.dockerfile }}",
      labels:
        "org.opencontainers.image.revision=${{ github.event.workflow_run.head_sha }}",
      platforms: "linux/amd64",
      push: true,
    })
    expect(readString(build.with?.tags)).toMatch(
      /:candidate-\$\{\{ github\.event\.workflow_run\.head_sha \}\}-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}$/u
    )
    expect(readString(build.with?.tags)).not.toMatch(/:latest(?:$|\s)/u)

    const generatedContract = findStepByAction(
      release,
      "actions/download-artifact"
    )
    expect(generatedContract.if).toBe("matrix.service != 'api'")
    expect(generatedContract.with).toEqual({
      name: "release-generated-contract-${{ github.event.workflow_run.head_sha }}",
      path: ".",
    })
    expect(release.steps.indexOf(generatedContract)).toBeLessThan(
      release.steps.indexOf(build)
    )
    expect(countRunCommand(workflow, "bun run generate")).toBe(1)
  })

  test("image build에는 공개 routing 설정만 전달하고 runtime secret은 전달하지 않는다", () => {
    const release = readJob(workflow, "release-images")
    const matrix = readObject(
      readObject(release.strategy, "release strategy").matrix,
      "release matrix"
    )
    const buildArgumentsByService = new Map(
      readObjectArray(matrix.include).map((target) => [
        readString(target.service),
        readBuildArgumentNames(target["build-args"]),
      ])
    )

    expect(buildArgumentsByService).toEqual(
      new Map([
        [
          "web",
          new Set([
            "API_BASE_URL",
            "CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS",
            "WEB_ORIGIN",
          ]),
        ],
        ["api", new Set()],
        [
          "admin",
          new Set([
            "ADMIN_ORIGIN",
            "API_BASE_URL",
            "CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS",
            "NEXT_PUBLIC_LEARNER_WEB_ORIGIN",
          ]),
        ],
      ])
    )
    for (const argumentNames of buildArgumentsByService.values()) {
      for (const argumentName of argumentNames) {
        expect(argumentName).not.toMatch(
          /(?:SECRET|TOKEN|PASSWORD|ACCESS_KEY|API_KEY)$/u
        )
      }
    }

    const preflight = findStepById(
      readJob(workflow, "release-preflight"),
      "inputs"
    )
    expect(preflight.env).toMatchObject({
      PRODUCTION_CONTENT_ASSET_PUBLIC_BASE_URL:
        "${{ vars.PRODUCTION_CONTENT_ASSET_PUBLIC_BASE_URL }}",
      STAGING_CONTENT_ASSET_PUBLIC_BASE_URL:
        "${{ vars.STAGING_CONTENT_ASSET_PUBLIC_BASE_URL }}",
    })
  })

  test("release manifest는 검증된 digest record만 집계해 staging에 전달한다", () => {
    const release = readJob(workflow, "release-images")
    expect(
      release.steps.some((step) =>
        step.uses?.startsWith("docker/metadata-action@")
      )
    ).toBe(false)

    const build = findStepById(release, "build")
    expect(JSON.stringify(build.with)).not.toMatch(
      /io\.writing-app|configuration-digest|vulnerability-policy-digest/u
    )

    const manifest = readJob(workflow, "release-manifest")
    const aggregate = findStepByRun(
      manifest,
      "bun scripts/image-release-metadata.ts aggregate"
    )
    expect(aggregate.run).toBe(
      "bun scripts/image-release-metadata.ts aggregate output/image-release-records output/image-release-manifest.json"
    )
    const upload = manifest.steps.find(
      (step) =>
        step.uses?.startsWith("actions/upload-artifact@") === true &&
        step.with?.path === "output/image-release-manifest.json"
    )
    expect(upload?.with).toMatchObject({
      name: "image-release-manifest-${{ github.event.workflow_run.head_sha }}",
      path: "output/image-release-manifest.json",
    })
    expect(upload?.with).not.toHaveProperty("retention-days")

    const staging = readJob(workflow, "staging-smoke")
    expect(readNeeds(staging)).toContain("release-manifest")
    expect(
      findStepByRun(staging, "bun scripts/test-deployment-images.ts").run
    ).toBe(
      "bun scripts/test-deployment-images.ts released output/image-release-manifest.json"
    )
  })

  test("HIGH 이상 취약점이 있는 digest는 승격과 attestation 전에 release를 차단한다", () => {
    const preflight = readJob(workflow, "release-preflight")
    expect(
      findStepByRun(
        preflight,
        "bun scripts/image-vulnerability-policy.ts validate"
      ).run
    ).toBe("bun scripts/image-vulnerability-policy.ts validate")

    const release = readJob(workflow, "release-images")
    const buildIndex = findStepIndex(release, (step) => step.id === "build")
    const scanIndex = findStepIndex(
      release,
      (step) => step.id === "vulnerability-scan"
    )
    const promoteIndex = findStepIndex(
      release,
      (step) => step.run?.startsWith("docker buildx imagetools create") === true
    )
    const attestIndex = findStepIndex(
      release,
      (step) => step.uses?.startsWith("actions/attest@") === true
    )
    const recordIndex = findStepIndex(
      release,
      (step) =>
        step.run === "bun scripts/image-release-metadata.ts write-record"
    )
    expect([
      buildIndex,
      scanIndex,
      promoteIndex,
      attestIndex,
      recordIndex,
    ]).toEqual(
      [
        ...new Set([
          buildIndex,
          scanIndex,
          promoteIndex,
          attestIndex,
          recordIndex,
        ]),
      ].sort((left, right) => left - right)
    )

    expect(
      findStepByRun(
        release,
        "bun scripts/image-vulnerability-policy.ts write-grype-config"
      ).run
    ).toContain("output/vulnerability-reports/${{ matrix.service }}.grype.yaml")
    const scan = findStepById(release, "vulnerability-scan")
    expect(scan.uses).toMatch(/^anchore\/scan-action@[0-9a-f]{40}$/u)
    expect(scan.with).toMatchObject({
      "fail-build": true,
      "grype-version": "v0.110.0",
      "only-fixed": false,
      "severity-cutoff":
        "${{ needs.release-preflight.outputs.vulnerability-severity-cutoff }}",
    })
    const report = release.steps.find(
      (step) =>
        step.uses?.startsWith("actions/upload-artifact@") === true &&
        step.with?.path ===
          "output/vulnerability-reports/${{ matrix.service }}.json"
    )
    expect(report?.if).toBe(
      "${{ always() && steps.build.outcome == 'success' }}"
    )
  })

  test("staging smoke 실패가 production 배포 경로를 구조적으로 차단한다", () => {
    const staging = readJob(workflow, "staging-smoke")
    expect(staging.environment).toBe("staging")
    expect(staging.permissions).toMatchObject({ packages: "read" })
    expect(staging.concurrency).toEqual({
      "cancel-in-progress": false,
      group: "writing-app-staging-deploy",
    })
    expect(staging.env).toBeUndefined()
    const stagingDeploy = findStepByRun(staging, "playbooks/deploy.yaml")
    expect(stagingDeploy.run).toContain(
      "--extra-vars writing_app_allow_deploy=true"
    )
    expect(stagingDeploy.run).toContain(
      "--extra-vars writing_app_hold_operation_lock_for_verify=true"
    )
    expect(stagingDeploy.run).toContain(
      "--extra-vars writing_app_verify_public_routes=true"
    )
    expect(stagingDeploy.run).toContain(
      'handoff_token="$(openssl rand -hex 32)"'
    )
    expect(stagingDeploy.run).toContain('echo "::add-mask::$handoff_token"')
    expect(
      stagingDeploy.run?.match(/--extra-vars "@\$handoff_file"/gu)
    ).toHaveLength(2)
    expect(stagingDeploy.run).toContain("bun scripts/assert-release-head.ts")
    const k6 = findStepByRun(staging, "k6 run scripts/k6-staging-smoke.js")
    expect(k6.env).toMatchObject({
      K6_ALLOW_STAGING_LOAD: "true",
      K6_LEARNER_COOKIE: "${{ secrets.K6_LEARNER_COOKIE }}",
    })
    expect(k6.shell).toBe("bash")
    const k6Commands = k6.run ?? ""
    expect(k6Commands).toContain("set -euo pipefail")
    expect(k6Commands.indexOf("k6 inspect")).toBeLessThan(
      k6Commands.indexOf("k6 run")
    )

    const production = readJob(workflow, "production-deploy")
    expect(new Set(readNeeds(production))).toEqual(
      new Set(["release-manifest", "staging-smoke"])
    )
    expect(production.environment).toBe("production")
    const deploy = findStepByRun(production, "playbooks/deploy.yaml")
    expect(deploy.run).toContain("--extra-vars @production-readiness-vars.json")
    expect(deploy.run).not.toContain(
      "--extra-vars writing_app_allow_deploy=true"
    )
    expect(deploy.run).toContain(
      "--extra-vars writing_app_hold_operation_lock_for_verify=true"
    )
    expect(deploy.run).toContain(
      "--extra-vars writing_app_verify_uses_existing_operation_lock=true"
    )
    expect(deploy.run).toContain(
      "--extra-vars writing_app_verify_finalize_deployment=true"
    )
    expect(deploy.run).toContain(
      "--extra-vars writing_app_verify_public_routes=true"
    )
    expect(deploy.run).toContain('handoff_token="$(openssl rand -hex 32)"')
    expect(deploy.run).toContain('echo "::add-mask::$handoff_token"')
    expect(deploy.run?.match(/--extra-vars "@\$handoff_file"/gu)).toHaveLength(
      2
    )
    expect(deploy.run).toContain("playbooks/verify.yaml")
  })

  test("production은 직렬 대기하고 호스트 변경 직전에 현재 main revision을 재검증한다", () => {
    expect(workflow).not.toHaveProperty("concurrency")

    const production = readJob(workflow, "production-deploy")
    expect(production.concurrency).toEqual({
      "cancel-in-progress": false,
      group: "writing-app-production-deploy",
    })

    const deploy = findStepByRun(production, "playbooks/deploy.yaml")
    expect(deploy.env).toEqual({
      GITHUB_TOKEN: "${{ github.token }}",
      RELEASE_REVISION: "${{ github.event.workflow_run.head_sha }}",
    })
    expect(deploy.run).toContain("bun scripts/assert-release-head.ts")
    expect(deploy.run).toContain("unset GITHUB_TOKEN")
    expect(
      deploy.run?.indexOf("bun scripts/assert-release-head.ts")
    ).toBeLessThan(deploy.run?.indexOf('eval "$(ssh-agent -s)"') ?? -1)
    expect(deploy.run?.indexOf("unset GITHUB_TOKEN")).toBeLessThan(
      deploy.run?.indexOf("ansible-playbook") ?? -1
    )
  })

  test("외부 법률 검토, 최근 staging 복구와 전체 E2E 증거 없이는 production을 차단한다", () => {
    const production = readJob(workflow, "production-deploy")
    const readiness = findStepByRun(
      production,
      "bun scripts/production-readiness.ts"
    )
    const expectedVariables = [
      "PRODUCTION_DEPLOY_APPROVED",
      "PRODUCTION_FULL_E2E_APPROVED",
      "PRODUCTION_LEGAL_REVIEW_APPROVED",
      "PRODUCTION_LEGAL_REVIEW_EVIDENCE_ID",
      "PRODUCTION_LEGAL_REVIEW_VERIFIED_AT",
      "PRODUCTION_READINESS_OUTPUT",
      "PRODUCTION_RESTORE_DRILL_APPROVED",
      "PRODUCTION_RESTORE_DRILL_ENVIRONMENT",
      "PRODUCTION_RESTORE_DRILL_EVIDENCE_ID",
      "PRODUCTION_RESTORE_DRILL_VERIFIED_AT",
      "QUALITY_GATE_RUN_URL",
      "RELEASE_REVISION",
    ]

    expect(new Set(Object.keys(readiness.env ?? {}))).toEqual(
      new Set(expectedVariables)
    )
    expect(readiness.env?.RELEASE_REVISION).toBe(
      "${{ github.event.workflow_run.head_sha }}"
    )
    expect(readiness.env?.QUALITY_GATE_RUN_URL).toContain(
      "${{ github.event.workflow_run.id }}"
    )
    expect(production.steps.indexOf(readiness)).toBeLessThan(
      findStepIndex(
        production,
        (step) => step.run?.includes("playbooks/deploy.yaml") === true
      )
    )
  })

  test("production credential이 없으면 배포 명령 전에 fail-closed한다", () => {
    const production = readJob(workflow, "production-deploy")
    const credentials = production.steps.find(
      (step) => step.env?.ANSIBLE_GROUP_VARS_YAML !== undefined
    )
    if (credentials === undefined) {
      throw new Error("production credential 준비 step을 찾지 못했습니다.")
    }

    const secretNames = [
      "ANSIBLE_GROUP_VARS_YAML",
      "ANSIBLE_HOSTS_YAML",
      "ANSIBLE_VAULT_PASSWORD",
      "ANSIBLE_VAULT_YAML",
      "SSH_KNOWN_HOSTS",
      "SSH_PRIVATE_KEY",
    ]
    expect(new Set(Object.keys(credentials.env ?? {}))).toEqual(
      new Set(secretNames)
    )
    for (const secretName of secretNames) {
      expect(credentials.env?.[secretName]).toBe(
        `\${{ secrets.${secretName} }}`
      )
    }
    expect(credentials.run).toContain('test -n "${!name}"')
    expect(credentials.run).toContain('"$HOME/.ssh/known_hosts"')
    expect(production.steps.indexOf(credentials)).toBeLessThan(
      findStepIndex(
        production,
        (step) => step.run?.includes("playbooks/deploy.yaml") === true
      )
    )
  })

  test("SBOM, provenance와 GitHub attestation을 동일 digest에 연결한다", () => {
    const release = readJob(workflow, "release-images")
    expect(release.permissions).toMatchObject({
      "artifact-metadata": "write",
      attestations: "write",
      "id-token": "write",
    })

    const build = findStepById(release, "build")
    expect(build.with).toMatchObject({
      provenance: "mode=max",
      sbom: true,
    })

    const attestation = findStepByAction(release, "actions/attest")
    expect(attestation.with).toMatchObject({
      "push-to-registry": true,
      "subject-digest": "${{ steps.build.outputs.digest }}",
    })
  })

  test("외부 action 변조가 실행되지 않도록 모든 workflow reference를 commit SHA로 고정한다", async () => {
    const workflowNames = (await readdir(workflowDirectory)).filter((name) =>
      /\.ya?ml$/u.test(name)
    )

    for (const workflowName of workflowNames) {
      const candidate = await readWorkflow(workflowName)
      for (const job of Object.values(candidate.jobs)) {
        for (const step of job.steps) {
          if (step.uses === undefined || step.uses.startsWith("./")) continue
          expect(step.uses).toMatch(/^[^@]+@[0-9a-f]{40}$/u)
        }
      }
    }
  })
})

type Workflow = {
  readonly jobs: Readonly<Record<string, WorkflowJob>>
  readonly on: Readonly<Record<string, unknown>>
  readonly permissions?: Readonly<Record<string, string>>
}

type WorkflowJob = {
  readonly concurrency?: unknown
  readonly env?: Readonly<Record<string, string>>
  readonly environment?: string
  readonly if?: string
  readonly needs?: string | readonly string[]
  readonly permissions?: Readonly<Record<string, string>>
  readonly steps: readonly WorkflowStep[]
  readonly strategy?: unknown
}

type WorkflowStep = {
  readonly env?: Readonly<Record<string, string>>
  readonly id?: string
  readonly if?: string
  readonly run?: string
  readonly shell?: string
  readonly uses?: string
  readonly with?: Readonly<Record<string, unknown>>
}

function findStepByAction(job: WorkflowJob, action: string): WorkflowStep {
  const step = job.steps.find(
    (candidate) => candidate.uses?.startsWith(`${action}@`) === true
  )
  if (step === undefined) {
    throw new Error(`${action} action step을 찾지 못했습니다.`)
  }
  return step
}

function findStepById(job: WorkflowJob, id: string): WorkflowStep {
  const step = job.steps.find((candidate) => candidate.id === id)
  if (step === undefined) {
    throw new Error(`${id} step을 찾지 못했습니다.`)
  }
  return step
}

function findStepByRun(job: WorkflowJob, command: string): WorkflowStep {
  const step = job.steps.find(
    (candidate) => candidate.run?.includes(command) === true
  )
  if (step === undefined) {
    throw new Error(`${command} 실행 step을 찾지 못했습니다.`)
  }
  return step
}

function findStepIndex(
  job: WorkflowJob,
  predicate: (step: WorkflowStep) => boolean
): number {
  const index = job.steps.findIndex(predicate)
  if (index < 0) {
    throw new Error("release 순서 검증 step을 찾지 못했습니다.")
  }
  return index
}

function readJob(candidate: Workflow, name: string): WorkflowJob {
  const job = candidate.jobs[name]
  if (job === undefined) {
    throw new Error(`${name} workflow job을 찾지 못했습니다.`)
  }
  return job
}

function readNeeds(job: WorkflowJob): readonly string[] {
  if (job.needs === undefined) return []
  return typeof job.needs === "string" ? [job.needs] : job.needs
}

function readObject(
  value: unknown,
  description: string
): Readonly<Record<string, unknown>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${description} 구성이 객체가 아닙니다.`)
  }
  return value as Readonly<Record<string, unknown>>
}

function readObjectArray(
  value: unknown
): readonly Readonly<Record<string, unknown>>[] {
  if (!Array.isArray(value)) {
    throw new Error("workflow matrix include가 배열이 아닙니다.")
  }
  return value.map((entry) => readObject(entry, "workflow matrix entry"))
}

function readString(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("workflow 값이 문자열이 아닙니다.")
  }
  return value
}

function readStringArray(value: unknown): readonly string[] {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw new Error("workflow 값이 문자열 배열이 아닙니다.")
  }
  return value as readonly string[]
}

function readBuildArgumentNames(value: unknown): ReadonlySet<string> {
  const source = readString(value)
  return new Set(
    source
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.split("=", 1)[0] ?? "")
  )
}

function countRunCommand(candidate: Workflow, command: string): number {
  return Object.values(candidate.jobs)
    .flatMap((job) =>
      job.steps.flatMap((step) => (step.run === undefined ? [] : [step.run]))
    )
    .filter((run) => run === command).length
}

async function readWorkflow(name: string): Promise<Workflow> {
  const source = await Bun.file(path.join(workflowDirectory, name)).text()
  return Bun.YAML.parse(source) as Workflow
}
