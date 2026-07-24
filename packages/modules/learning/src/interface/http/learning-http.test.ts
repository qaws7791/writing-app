import { describe, expect, it, vi } from "vitest"

import {
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import { createApp } from "@workspace/http-platform/app"
import { err, ok } from "@workspace/kernel/result"

import type { LearningApplication } from "#learning/application/learning-application"
import { createLearnerCursorCodec } from "#learning/infrastructure/persistence/learner-cursor"
import {
  registerLearningRoutes,
  type LearningHonoEnv,
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
    expect(fixture.application.readCourseCatalog).not.toHaveBeenCalled()
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
    expect(fixture.application.submitStep).not.toHaveBeenCalled()
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
      submitStep: async () =>
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

  it("AI 코칭 fallback을 명시적 submit completion으로 전달한다", async () => {
    const submitStep = vi.fn(async () =>
      ok({ evaluation: null, kind: "advanced" as const, learning })
    )
    const fixture = createFixture({ submitStep })

    const response = await fixture.app.request(
      "/learning/lessons/lesson-1/steps/step-1/complete",
      {
        body: JSON.stringify({ kind: "skip-ai-feedback" }),
        headers: {
          Cookie: "learner=active",
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    )

    expect(response.status).toBe(200)
    expect(submitStep).toHaveBeenCalledWith({
      completion: { kind: "skip-ai-feedback" },
      learnerId,
      lessonId,
      stepId,
    })
  })

  it("draft를 저장하고 stale expected version을 canonical 409로 mapping한다", async () => {
    const success = createFixture()
    const stale = createFixture({
      saveStepDraft: async () =>
        err({
          currentVersion: 1,
          kind: "step-draft-version-conflict",
          lessonId,
          stepId,
        }),
    })
    const request = {
      body: JSON.stringify({
        answer: { text: "서버 초안", type: "WRITE" },
        expectedCurriculumVersionId: curriculumVersionId,
        expectedVersion: null,
      }),
      headers: {
        Cookie: "learner=active",
        "Content-Type": "application/json",
      },
      method: "PUT",
    }

    const saved = await success.app.request(
      "/learning/lessons/lesson-1/steps/step-1/draft",
      request
    )
    const conflicted = await stale.app.request(
      "/learning/lessons/lesson-1/steps/step-1/draft",
      request
    )

    expect(saved.status).toBe(200)
    await expect(saved.json()).resolves.toMatchObject({
      answer: { text: "초안", type: "WRITE" },
      stepId,
      version: 0,
    })
    expect(conflicted.status).toBe(409)
    await expect(conflicted.json()).resolves.toMatchObject({
      code: "STEP_DRAFT_VERSION_CONFLICT",
    })
  })
})

type Overrides = Readonly<{
  getCourseDetail?: LearningApplication["readCourseDetail"]
  getLesson?: LearningApplication["readLesson"]
  saveStepDraft?: LearningApplication["saveStepDraft"]
  submitStep?: LearningApplication["submitStep"]
}>

function createFixture(overrides: Overrides = {}, requestActors?: unknown[]) {
  const application: LearningApplication = {
    readCourseCatalog: vi.fn(async () => ({
      items: [],
      nextPosition: null,
    })),
    readCourseCategories: vi.fn(async () => []),
    readCourseDetail:
      overrides.getCourseDetail ??
      vi.fn(async () => err({ kind: "course-not-found" as const })),
    readLearnerHome: vi.fn(async () => ({ items: [], nextPosition: null })),
    readLesson:
      overrides.getLesson ??
      vi.fn(async () => err({ kind: "lesson-not-found" as const })),
    requestAiFeedback: vi.fn(async () =>
      err({ kind: "provider-unavailable" as const, remainingAttempts: 1 })
    ),
    saveStepDraft:
      overrides.saveStepDraft ??
      vi.fn(async () =>
        ok({
          answer: { text: "초안", type: "WRITE" as const },
          stepId,
          updatedAt: "2026-07-22T15:00:00.000Z",
          version: 0,
        })
      ),
    startLesson: vi.fn(async () => ok({ ...learning, drafts: [] })),
    submitStep:
      overrides.submitStep ??
      vi.fn(async () =>
        ok({ evaluation: null, kind: "advanced" as const, learning })
      ),
  }
  const session: LearningLearnerSessionPort = {
    async resolveLearner(headers) {
      const cookie = headers.get("Cookie")
      if (cookie === null) return null
      if (cookie === "learner=inactive") return { kind: "inactive", learnerId }
      return { kind: "active", learnerId }
    },
  }
  const app = createApp<LearningHonoEnv>({
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
  })
  registerLearningRoutes(app, {
    application,
    cursor: createLearnerCursorCodec(
      "learning-http-test-secret-at-least-32-bytes"
    ),
    session,
  })

  return {
    app,
    application,
  }
}
