import { describe, expect, it, vi } from "vitest"

import {
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import { createApp } from "@workspace/http-platform/core"
import { err, ok } from "@workspace/kernel/result"

import type { LearningApplication } from "#learning/application/learning-application"
import type { LearningQueries } from "#learning/application/learning-queries"
import { createLearnerCursorCodec } from "#learning/infrastructure/persistence/learner-cursor"
import {
  createLearningRoutes,
  type LearningLearnerSessionPort,
} from "#learning/interface/http/learning-routes"

const learnerId = learnerIdSchema.parse("learner-1")
const lessonId = lessonIdSchema.parse("lesson-1")
const stepId = lessonStepIdSchema.parse("step-1")
const curriculumVersionId = curriculumVersionIdSchema.parse("curriculum-1")
const learning = {
  completedSteps: 0,
  currentStepId: stepId,
  currentStepIndex: 0,
  progressPercent: 0,
  status: "in_progress" as const,
  totalSteps: 2,
  version: { curriculumVersionId, revision: 1 },
}

describe("learning HTTP interface", () => {
  it("unauthenticated와 inactive learner를 query 호출 전에 거절한다", async () => {
    const requestActors: unknown[] = []
    const fixture = createFixture({}, requestActors)

    const unauthenticated = await fixture.app.request("/courses")
    const inactive = await fixture.app.request("/courses", {
      headers: { Cookie: "learner=inactive" },
    })

    expect(unauthenticated.status).toBe(401)
    expect(inactive.status).toBe(403)
    expect(inactive.headers.get("Cache-Control")).toBe("private, no-store")
    expect(inactive.headers.get("Vary")).toContain("Cookie")
    expect(fixture.queries.content.listCourses).not.toHaveBeenCalled()
    expect(requestActors[1]).toMatchObject({
      id: "learner-1",
      type: "learner",
    })
  })

  it("잘못된 transition body를 application 호출 전에 400으로 거절한다", async () => {
    const fixture = createFixture()

    const response = await fixture.app.request(
      "/learning/lessons/lesson-1/steps/step-1/complete",
      {
        body: JSON.stringify({ kind: "answer", answer: { type: "UNKNOWN" } }),
        headers: {
          Cookie: "learner=active",
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    )

    expect(response.status).toBe(400)
    expect(fixture.application.answerStep).not.toHaveBeenCalled()
  })

  it("course·lesson not-found를 canonical 404 code로 mapping한다", async () => {
    const fixture = createFixture({
      getCourseDetail: async () => err({ kind: "course-not-found" }),
      getLesson: async () => err({ kind: "lesson-not-found" }),
    })
    const headers = { Cookie: "learner=active" }

    const [course, lesson] = await Promise.all([
      fixture.app.request("/courses/missing", { headers }),
      fixture.app.request("/lessons/missing", { headers }),
    ])

    expect(course.status).toBe(404)
    expect(lesson.status).toBe(404)
    await expect(course.json()).resolves.toMatchObject({
      code: "COURSE_NOT_FOUND",
    })
    await expect(lesson.json()).resolves.toMatchObject({
      code: "LESSON_NOT_FOUND",
    })
  })

  it("step sequence conflict를 canonical 409로 mapping한다", async () => {
    const fixture = createFixture({
      completeStep: async () =>
        err({ kind: "step-sequence-conflict", lessonId, stepId }),
    })

    const response = await fixture.app.request(
      "/learning/lessons/lesson-1/steps/step-1/complete",
      {
        body: JSON.stringify({ kind: "acknowledge" }),
        headers: {
          Cookie: "learner=active",
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      code: "STEP_SEQUENCE_CONFLICT",
    })
  })

  it("route registry가 canonical learner operation과 path를 한 번씩 공개한다", () => {
    const fixture = createFixture()
    const definitions = fixture.routes.map(({ route }) => [
      route.operationId,
      route.path,
    ])

    expect(definitions).toEqual([
      ["getCourses", "/courses"],
      ["getCourseCategories", "/course-categories"],
      ["getCourseDetail", "/courses/{courseId}"],
      ["getLesson", "/lessons/{lessonId}"],
      ["getProgress", "/progress"],
      ["startLearnerLesson", "/learning/lessons/{lessonId}/start"],
      [
        "completeLearnerStep",
        "/learning/lessons/{lessonId}/steps/{stepId}/complete",
      ],
    ])
    expect(new Set(definitions.map(([operationId]) => operationId)).size).toBe(
      definitions.length
    )
  })
})

type Overrides = Readonly<{
  completeStep?: LearningApplication["completeStep"]
  getCourseDetail?: LearningQueries["content"]["getCourseDetail"]
  getLesson?: LearningQueries["content"]["getLesson"]
}>

function createFixture(overrides: Overrides = {}, requestActors?: unknown[]) {
  const application: LearningApplication = {
    answerStep: vi.fn(async () =>
      ok({ evaluation: null, kind: "advanced" as const, learning })
    ),
    completeStep:
      overrides.completeStep ??
      vi.fn(async () =>
        ok({ evaluation: null, kind: "advanced" as const, learning })
      ),
    requestAiFeedback: vi.fn(async () =>
      err({ kind: "provider-unavailable" as const, remainingAttempts: 1 })
    ),
    startLesson: vi.fn(async () => ok(learning)),
  }
  const queries: LearningQueries = {
    content: {
      getCourseDetail:
        overrides.getCourseDetail ??
        vi.fn(async () => err({ kind: "course-not-found" as const })),
      getLesson:
        overrides.getLesson ??
        vi.fn(async () => err({ kind: "lesson-not-found" as const })),
      listCourseCategories: vi.fn(async () => []),
      listCourses: vi.fn(async () => ({ items: [], nextPosition: null })),
    },
    progress: {
      readProgress: vi.fn(async () => ({ items: [], nextPosition: null })),
    },
  }
  const session: LearningLearnerSessionPort = {
    async resolveLearner(headers) {
      const cookie = headers.get("Cookie")
      if (cookie === null) return null
      if (cookie === "learner=inactive") return { kind: "inactive", learnerId }
      return { kind: "active", learnerId }
    },
  }
  const routes = createLearningRoutes({
    application,
    cursor: createLearnerCursorCodec(
      "learning-http-test-secret-at-least-32-bytes"
    ),
    queries,
    session,
  })

  return {
    app: createApp({
      middleware:
        requestActors === undefined
          ? []
          : [
              async (context, next) => {
                try {
                  await next()
                } finally {
                  requestActors.push(context.get("requestActor"))
                }
              },
            ],
      routes,
    }),
    application,
    queries,
    routes,
  }
}
