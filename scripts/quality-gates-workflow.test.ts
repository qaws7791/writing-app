import { describe, expect, test } from "bun:test"
import path from "node:path"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const workflow = await readWorkflow()
const rootManifest = (await Bun.file(
  path.join(repositoryRoot, "package.json")
).json()) as RootManifest
const mainCondition =
  "github.event_name == 'push' && github.ref == 'refs/heads/main'"

describe("quality gate workflow", () => {
  test("OpenAPI·Orval은 content cache에서 한 번만 생성해 모든 consumer에 fan-out한다", () => {
    const generated = readJob("generated-contract")
    expect(generated.if).toBeUndefined()
    expect(readRunCommands(generated)).toContain("bun run generate")

    const cache = findStepByAction(generated, "actions/cache")
    expect(cache.id).toBe("generated-cache")
    expect(cache.with?.key).toContain("hashFiles(")
    expect(cache.with?.path).toContain(".turbo/cache")
    expect(cache.with?.path).toContain("apps/api/.generated")
    expect(cache.with?.path).toContain("packages/infra/http-client/.generated")

    const upload = findStepByAction(generated, "actions/upload-artifact")
    expect(upload.with).toMatchObject({
      "if-no-files-found": "error",
      "include-hidden-files": true,
      name: "generated-contract-${{ github.sha }}",
      "retention-days": 1,
    })

    for (const jobName of [
      "static-generated",
      "tests",
      "build",
      "pr-e2e",
      "main-e2e",
      "lighthouse",
      "deployment-smoke",
    ]) {
      const consumer = readJob(jobName)
      expect(readNeeds(consumer)).toEqual(["generated-contract"])
      expect(
        findStepByAction(consumer, "actions/download-artifact").with
      ).toEqual({
        name: "generated-contract-${{ github.sha }}",
        path: ".",
      })
    }
    expect(countRunCommand("bun run generate")).toBe(1)
  })

  test("PR은 정적·unit·integration·bundle과 단일 Chromium smoke를 병렬 실행한다", () => {
    expect(
      Object.prototype.hasOwnProperty.call(workflow.on, "pull_request")
    ).toBe(true)

    const staticGenerated = readJob("static-generated")
    expect(staticGenerated.if).toBeUndefined()
    expect(readRunCommands(staticGenerated)).toContain("bun run ci:static")
    expect(readRootScript("ci:static")).toContain("--parallel")
    expect(readRootScriptsByPrefix("ci:static:")).toEqual(
      expect.arrayContaining([
        "bun run format:check",
        "bun run lint",
        "bun run test:oxlint-rules",
        "bun run check:architecture",
        "bun run check:knip",
        "bun run check:dependencies",
        "bun run typecheck",
      ])
    )

    const tests = readJob("tests")
    expect(tests.if).toBeUndefined()
    expect(readRunCommands(tests)).toContain("bun run ci:tests")
    expect(readRootScript("ci:tests")).toContain("--parallel")
    expect(readRootScriptsByPrefix("ci:tests:")).toEqual(
      expect.arrayContaining(["bun test ./scripts", "bun run test"])
    )

    const build = readJob("build")
    expect(build.if).toBe("github.event_name == 'pull_request'")
    expect(readRunCommands(build)).toEqual(
      expect.arrayContaining(["bun run build", "bun run check:route-bundles"])
    )

    const smoke = readJob("pr-e2e")
    expect(smoke.if).toBe("github.event_name == 'pull_request'")
    expect(readRunCommands(smoke)).toEqual(
      expect.arrayContaining([
        "bunx playwright install --with-deps chromium",
        "bun run test:e2e:pr",
      ])
    )
    expect(JSON.stringify(smoke)).not.toContain("webkit")
  })

  test("workflow schema는 checksum으로 고정한 표준 actionlint로 검사한다", () => {
    const workflowStatic = readJob("workflow-static")
    expect(workflowStatic.if).toBeUndefined()
    expect(readNeeds(workflowStatic)).toEqual([])

    const command = readRunCommands(workflowStatic).join("\n")
    expect(command).toContain(
      "actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz"
    )
    expect(command).toContain(
      "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8"
    )
    expect(command).toContain('"$RUNNER_TEMP/actionlint"')
  })

  test("main은 PR과 같은 test suite와 Chromium·WebKit release E2E를 한 번씩 실행한다", () => {
    const e2e = readJob("main-e2e")
    expect(e2e.if).toBe(mainCondition)
    expect(readRunCommands(e2e)).toEqual(
      expect.arrayContaining([
        "bunx playwright install --with-deps chromium webkit",
        "bun run test:storybook",
        "bun run test:e2e:release",
      ])
    )

    expect(workflow.jobs).not.toHaveProperty("learner-e2e")
    expect(workflow.jobs).not.toHaveProperty("admin-e2e")
    expect(workflow.jobs).not.toHaveProperty("main-tests")
    expect(countRootScriptCommand("bun test ./scripts")).toBe(1)
    expect(countRootScriptCommand("bun run test")).toBe(1)
    expect(countRunCommand("bun run test:e2e:release")).toBe(1)
    expect(countRunCommand("bun run test:e2e:pr")).toBe(1)
  })

  test("main release gate는 성능·Ansible·source image smoke를 병렬 차단한다", () => {
    for (const name of ["lighthouse", "ansible-static", "deployment-smoke"]) {
      expect(readJob(name).if).toBe(mainCondition)
    }

    expect(readRunCommands(readJob("lighthouse"))).toContain(
      "bun run test:performance:lighthouse"
    )
    expect(workflow.jobs).not.toHaveProperty("staging-performance")
    expect(countRunCommand("k6 run scripts/k6-staging-smoke.js")).toBe(0)
    expect(
      readRunCommands(readJob("ansible-static")).some((command) =>
        command.includes("bun run check:deployment-ansible")
      )
    ).toBe(true)
    expect(
      readRunCommands(readJob("ansible-static")).some((command) =>
        command.includes("bun run test:deployment-bootstrap")
      )
    ).toBe(true)
    const bootstrap = findStepByRun(
      readJob("ansible-static"),
      "bun run test:deployment-bootstrap"
    )
    expect(bootstrap.shell).toBe("bash")
    expect(bootstrap.run).toContain("set -euo pipefail")
    expect(readRunCommands(readJob("deployment-smoke"))).toContain(
      "bun scripts/test-deployment-images.ts"
    )
    expect(rootManifest.scripts["test:deployment-images"]).toBe(
      "bun run generate && bun scripts/test-deployment-images.ts"
    )
  })
})

type Workflow = {
  readonly jobs: Readonly<Record<string, WorkflowJob>>
  readonly on: Readonly<Record<string, unknown>>
}

type RootManifest = {
  readonly scripts: Readonly<Record<string, string>>
}

type WorkflowJob = {
  readonly environment?: string
  readonly if?: string
  readonly needs?: readonly string[] | string
  readonly steps: readonly WorkflowStep[]
}

type WorkflowStep = {
  readonly id?: string
  readonly run?: string
  readonly shell?: string
  readonly uses?: string
  readonly with?: Readonly<Record<string, unknown>>
}

function readJob(name: string): WorkflowJob {
  const job = workflow.jobs[name]
  if (job === undefined) {
    throw new Error(`${name} workflow job을 찾지 못했습니다.`)
  }
  return job
}

function readRunCommands(job: WorkflowJob): readonly string[] {
  return job.steps.flatMap((step) => (step.run === undefined ? [] : [step.run]))
}

function readNeeds(job: WorkflowJob): readonly string[] {
  if (job.needs === undefined) return []
  return typeof job.needs === "string" ? [job.needs] : job.needs
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

function findStepByRun(job: WorkflowJob, command: string): WorkflowStep {
  const step = job.steps.find(
    (candidate) => candidate.run?.includes(command) === true
  )
  if (step === undefined) {
    throw new Error(`${command} 실행 step을 찾지 못했습니다.`)
  }
  return step
}

function countRunCommand(command: string): number {
  return Object.values(workflow.jobs)
    .flatMap(readRunCommands)
    .filter((candidate) => candidate === command).length
}

function countRootScriptCommand(command: string): number {
  return Object.values(rootManifest.scripts).filter(
    (candidate) => candidate === command
  ).length
}

function readRootScript(name: string): string {
  const command = rootManifest.scripts[name]
  if (command === undefined) {
    throw new Error(`${name} root script를 찾지 못했습니다.`)
  }
  return command
}

function readRootScriptsByPrefix(prefix: string): readonly string[] {
  return Object.entries(rootManifest.scripts)
    .filter(([name]) => name.startsWith(prefix))
    .map(([, command]) => command)
}

async function readWorkflow(): Promise<Workflow> {
  const source = await Bun.file(
    path.join(repositoryRoot, ".github", "workflows", "quality-gates.yml")
  ).text()
  return Bun.YAML.parse(source) as Workflow
}
