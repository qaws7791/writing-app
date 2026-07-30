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
const aiFeedbackPath =
  "/learning/lessons/lesson-1/steps/step-1/ai-feedback" as const
const presentationSecret = "learning-http-test-secret-at-least-32-bytes"
const aiFeedbackTransition = {
  feedback: {
    improvements: ["근거를 보강하세요."],
    nextAction: "예시를 추가하세요.",
    remainingAttempts: 2,
    strengths: ["주장이 명확합니다."],
    summary: "좋은 초안입니다.",
  },
  transition: { evaluation: null, kind: "advanced" as const, learning },
}

describe("learning HTTP interface", () => {
  it("unauthenticated 요청을 query 호출 전에 401로 거절한다", async () => {
    const fixture = createFixture()

    const response = await fixture.app.request("/courses")

    expect(response.status).toBe(401)
    expect(fixture.application.readCourseCatalog).not.toHaveBeenCalled()
  })

  it("inactive learner를 private no-store 403으로 거절한다", async () => {
    const fixture = createFixture()

    const response = await fixture.app.request("/courses", {
      headers: { Cookie: "learner=inactive" },
    })

    expect(response.status).toBe(403)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(response.headers.get("Vary")).toContain("Cookie")
    expect(fixture.application.readCourseCatalog).not.toHaveBeenCalled()
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

  it("AI 코칭 요청에 idempotency key와 요청 signal을 전달한다", async () => {
    const requestAiFeedback = vi.fn(async () => ok(aiFeedbackTransition))
    const controller = new AbortController()
    const fixture = createFixture({ requestAiFeedback })

    const response = await fixture.app.request(aiFeedbackPath, {
      headers: { Cookie: "learner=active", "Idempotency-Key": "request-1" },
      method: "POST",
      signal: controller.signal,
    })

    expect(response.status).toBe(200)
    expect(requestAiFeedback).toHaveBeenCalledWith(
      {
        idempotencyKey: "request-1",
        learnerId,
        lessonId,
        stepId,
      },
      { signal: controller.signal }
    )
  })

  it("일시적 AI 코칭 제한만 Retry-After를 붙이고 영구 제한은 붙이지 않는다", async () => {
    const inProgress = createFixture({
      requestAiFeedback: async () =>
        err({
          kind: "attempt-in-progress",
          remainingAttempts: 2,
          retryAfterSeconds: 17,
        }),
    })
    const dailyQuota = createFixture({
      requestAiFeedback: async () =>
        err({
          kind: "daily-quota-exceeded",
          remainingAttempts: 2,
          retryAfterSeconds: 7_200,
        }),
    })
    const attemptLimit = createFixture({
      requestAiFeedback: async () =>
        err({ kind: "attempt-limit-exceeded", remainingAttempts: 0 }),
    })

    const [lease, quota, limit] = await Promise.all([
      requestAiFeedback(inProgress.app),
      requestAiFeedback(dailyQuota.app),
      requestAiFeedback(attemptLimit.app),
    ])

    expect(lease.status).toBe(409)
    expect(lease.headers.get("retry-after")).toBe("17")
    await expect(lease.json()).resolves.toMatchObject({
      code: "ATTEMPT_IN_PROGRESS",
    })
    expect(quota.status).toBe(429)
    expect(quota.headers.get("retry-after")).toBe("7200")
    await expect(quota.json()).resolves.toMatchObject({
      code: "AI_FEEDBACK_DAILY_QUOTA_EXCEEDED",
    })
    expect(limit.status).toBe(429)
    expect(limit.headers.get("retry-after")).toBeNull()
    await expect(limit.json()).resolves.toMatchObject({
      code: "ATTEMPT_LIMIT_EXCEEDED",
    })
  })

  it("provider 응답 검증 실패를 canonical 503 PROVIDER_UNAVAILABLE로 mapping한다", async () => {
    const fixture = createFixture({
      requestAiFeedback: async () =>
        err({ kind: "provider-response-invalid", remainingAttempts: 1 }),
    })

    const response = await requestAiFeedback(fixture.app)

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
    })
  })
})

type Overrides = Readonly<{
  getCourseDetail?: LearningApplication["readCourseDetail"]
  getLesson?: LearningApplication["readLesson"]
  requestAiFeedback?: LearningApplication["requestAiFeedback"]
  saveStepDraft?: LearningApplication["saveStepDraft"]
  submitStep?: LearningApplication["submitStep"]
}>

function requestAiFeedback(app: ReturnType<typeof createFixture>["app"]) {
  return app.request(aiFeedbackPath, {
    headers: { Cookie: "learner=active", "Idempotency-Key": "request-1" },
    method: "POST",
  })
}

function createFixture(overrides: Overrides = {}) {
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
    requestAiFeedback:
      overrides.requestAiFeedback ??
      vi.fn(async () =>
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
  const app = createApp<LearningHonoEnv>()
  registerLearningRoutes(app, {
    application,
    cursor: createLearnerCursorCodec(presentationSecret),
    session,
  })

  return {
    app,
    application,
  }
}
