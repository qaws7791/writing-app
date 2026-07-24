import { describe, expect, test } from "bun:test"
import path from "node:path"

import {
  assertRouteBundleBudget,
  routeBundleChecks,
} from "#scripts/check-route-bundles"
import {
  createK6StagingConfiguration,
  isCourseListResponse,
  isIncorrectLessonSubmission,
  isLessonInProgress,
  isReadyHealthResponse,
  isRetryableLessonSubmission,
  k6StagingOptions,
} from "./k6-staging-config.js"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const qualityWorkflow = await readWorkflow("quality-gates.yml")

describe("성능 회귀 gate", () => {
  test("핵심 learner route의 초기 JS 예산 초과 원인을 큰 chunk부터 보고한다", () => {
    const learnerChecks = routeBundleChecks.filter(
      (check) => check.app === "web"
    )

    expect(new Set(learnerChecks.map((check) => check.name))).toEqual(
      new Set(["/", "/app", "/app/lesson"])
    )
    for (const route of ["/app", "/app/lesson"]) {
      expect(
        learnerChecks.find((check) => check.name === route)?.manifestPath
      ).toMatch(/page_client-reference-manifest\.js$/u)
    }

    expect(() =>
      assertRouteBundleBudget(
        { maximumGzipBytes: 35_000, name: "/app" },
        40_000,
        [
          { gzipBytes: 10_000, path: "static/chunks/small.js" },
          { gzipBytes: 30_000, path: "static/chunks/large.js" },
        ]
      )
    ).toThrow(
      [
        "/app 초기 JS gzip 예산을 초과했습니다: 40000 > 35000",
        "초기 chunk gzip 원인:",
        "- static/chunks/large.js: 30000 bytes",
        "- static/chunks/small.js: 10000 bytes",
      ].join("\n")
    )
  })

  test("Lighthouse는 인증된 세 mobile 화면을 반복 측정하고 report를 보존한다", () => {
    const configuration = readLighthouseConfiguration()
    const collect = configuration.ci.collect

    expect(new Set(collect.url)).toEqual(
      new Set([
        "http://localhost:3200/",
        "http://localhost:3200/app",
        "http://localhost:3200/app/lesson?lesson_id=e2e-transition-lesson",
      ])
    )
    expect(collect.numberOfRuns).toBe(3)
    expect(collect.settings.port).toBe(42_222)
    expect(collect.settings.onlyCategories).toEqual(["performance"])
    expect(JSON.parse(collect.settings.extraHeaders)).toEqual({
      Cookie: "learner.session=test",
    })
    expect(configuration.ci.upload).toEqual({
      outputDir: "output/lighthouse",
      target: "filesystem",
    })

    for (const assertion of Object.values(configuration.ci.assert.assertions)) {
      expect(assertion[0]).toBe("error")
      expect(assertion[1].aggregationMethod).toBe("median-run")
    }
  })

  test("k6 staging 부하는 production과 AI 경로를 피하고 재시도 가능한 오답 전이를 측정한다", () => {
    const environment = {
      K6_ALLOW_STAGING_LOAD: "true",
      K6_CURRICULUM_VERSION_ID: "curriculum-1",
      K6_LEARNER_COOKIE: "learner.session=staging",
      K6_LESSON_ID: "lesson/1",
      K6_PRODUCTION_ORIGIN: "https://writing.example.com",
      K6_STAGING_ORIGIN: "https://staging.writing.example.com",
      K6_STEP_ID: "step/1",
      K6_WRONG_OPTION_ID: "wrong-option",
    }
    const configuration = createK6StagingConfiguration(environment)

    expect(() =>
      createK6StagingConfiguration({
        ...environment,
        K6_STAGING_ORIGIN: environment.K6_PRODUCTION_ORIGIN,
      })
    ).toThrow("production origin과 달라야")
    expect(() =>
      createK6StagingConfiguration({
        ...environment,
        K6_ALLOW_STAGING_LOAD: "false",
      })
    ).toThrow("승인이 필요")
    for (const invalidOrigin of [
      "https://staging.writing.example.com/",
      "https://user@staging.writing.example.com",
      "HTTPS://staging.writing.example.com",
    ]) {
      expect(() =>
        createK6StagingConfiguration({
          ...environment,
          K6_STAGING_ORIGIN: invalidOrigin,
        })
      ).toThrow("경로가 없는 HTTPS origin")
    }

    expect(
      new Set(
        Object.values(configuration.requests).map((request) => request.name)
      )
    ).toEqual(
      new Set(["health", "course-list", "lesson-start", "lesson-submit"])
    )
    expect(configuration.requests.health).toMatchObject({
      method: "GET",
      url: "https://staging.writing.example.com/api/health",
    })
    expect(configuration.requests.courseList).toMatchObject({
      method: "GET",
      url: "https://staging.writing.example.com/api/courses",
    })
    expect(configuration.requests.lessonStart).toMatchObject({
      body: { expectedCurriculumVersionId: "curriculum-1" },
      method: "POST",
      url: "https://staging.writing.example.com/api/learning/lessons/lesson%2F1/start",
    })
    expect(configuration.requests.lessonSubmit).toMatchObject({
      body: {
        answer: {
          selectedOptionId: "wrong-option",
          type: "MULTIPLE_CHOICE",
        },
        kind: "answer",
      },
      method: "POST",
      url: "https://staging.writing.example.com/api/learning/lessons/lesson%2F1/steps/step%2F1/complete",
    })
    expect(k6StagingOptions.scenarios.readRoutes.executor).toBe("constant-vus")
    expect(k6StagingOptions.scenarios.lessonTransitions.executor).toBe(
      "per-vu-iterations"
    )
    expect(new Set(Object.keys(k6StagingOptions.thresholds))).toEqual(
      new Set([
        "checks",
        "http_req_failed",
        "http_req_duration{name:course-list}",
        "http_req_duration{name:health}",
        "http_req_duration{name:lesson-start}",
        "http_req_duration{name:lesson-submit}",
      ])
    )
    expect(isReadyHealthResponse({ ok: true })).toBe(true)
    expect(isCourseListResponse({ items: [] })).toBe(true)
    expect(isLessonInProgress({ status: "in_progress" })).toBe(true)
    expect(
      isIncorrectLessonSubmission({
        evaluation: { correct: false },
        status: "retry",
      })
    ).toBe(true)
    expect(isRetryableLessonSubmission({ status: "retry" })).toBe(true)
    expect(JSON.stringify(configuration)).not.toMatch(/ai-feedback|openai/iu)
  })

  test("PR은 bundle 예산을, main은 Lighthouse를 차단 gate로 실행한다", () => {
    expect(
      Object.prototype.hasOwnProperty.call(qualityWorkflow.on, "pull_request")
    ).toBe(true)

    const build = readJob("build")
    expect(build.if).toBe("github.event_name == 'pull_request'")
    expect(readRunCommands(build)).toContain("bun run check:route-bundles")

    const lighthouse = readJob("lighthouse")
    expect(lighthouse.if).toBe(
      "github.event_name == 'push' && github.ref == 'refs/heads/main'"
    )
    expect(readRunCommands(lighthouse)).toContain(
      "bun run test:performance:lighthouse"
    )

    expect(qualityWorkflow.jobs).not.toHaveProperty("staging-performance")
    expect(
      Object.values(qualityWorkflow.jobs)
        .flatMap(readRunCommands)
        .filter((command) => command === "k6 run scripts/k6-staging-smoke.js")
    ).toHaveLength(0)
  })
})

type LighthouseConfiguration = {
  readonly ci: {
    readonly assert: {
      readonly assertions: Readonly<
        Record<
          string,
          readonly [
            string,
            {
              readonly aggregationMethod: string
            },
          ]
        >
      >
    }
    readonly collect: {
      readonly numberOfRuns: number
      readonly settings: {
        readonly extraHeaders: string
        readonly onlyCategories: readonly string[]
        readonly port: number
      }
      readonly url: readonly string[]
    }
    readonly upload: {
      readonly outputDir: string
      readonly target: string
    }
  }
}

type Workflow = {
  readonly jobs: Readonly<Record<string, WorkflowJob>>
  readonly on: Readonly<Record<string, unknown>>
}

type WorkflowJob = {
  readonly environment?: string
  readonly if?: string
  readonly steps: readonly WorkflowStep[]
}

type WorkflowStep = {
  readonly run?: string
  readonly uses?: string
}

function readJob(name: string): WorkflowJob {
  const job = qualityWorkflow.jobs[name]
  if (job === undefined) {
    throw new Error(`${name} workflow job을 찾지 못했습니다.`)
  }
  return job
}

function readRunCommands(job: WorkflowJob): readonly string[] {
  return job.steps.flatMap((step) => (step.run === undefined ? [] : [step.run]))
}

async function readWorkflow(name: string): Promise<Workflow> {
  const source = await Bun.file(
    path.join(repositoryRoot, ".github", "workflows", name)
  ).text()
  return Bun.YAML.parse(source) as Workflow
}

function readLighthouseConfiguration(): LighthouseConfiguration {
  const result = Bun.spawnSync({
    cmd: [
      "node",
      "-e",
      [
        'process.env.LIGHTHOUSE_AUTH_COOKIE = "learner.session=test";',
        'process.env.LIGHTHOUSE_CHROME_PATH = "/tmp/chromium";',
        'process.env.LIGHTHOUSE_CHROME_DEBUGGING_PORT = "42222";',
        'process.stdout.write(JSON.stringify(require("./lighthouse-ci.config.cjs")));',
      ].join(""),
    ],
    cwd: repositoryRoot,
    stderr: "pipe",
    stdout: "pipe",
  })

  if (!result.success) {
    throw new Error(result.stderr.toString())
  }

  return JSON.parse(result.stdout.toString()) as LighthouseConfiguration
}
