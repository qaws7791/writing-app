import { describe, expect, it, vi } from "vitest"
import { inProgressLessonLearningStateSchema } from "@workspace/contracts/learning/step-data"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import { createApp } from "@workspace/http-platform/core"
import { err, ok } from "@workspace/kernel/result"

import {
  createAiFeedbackRoutes,
  type AiFeedbackHttpCommandPort,
  type AiFeedbackLearnerSessionPort,
} from "#ai-feedback/interface/http/ai-feedback-routes"

const path = "/learning/lessons/lesson-1/steps/feedback-step/ai-feedback"
const successResult = {
  feedback: {
    improvements: ["근거를 보강하세요."],
    nextAction: "예시를 추가하세요.",
    remainingAttempts: 2,
    score: 80,
    scoreRange: [0, 100] as [0, 100],
    showScore: true,
    strengths: ["주장이 명확합니다."],
    summary: "좋은 초안입니다.",
  },
  transition: {
    evaluation: null,
    learning: inProgressLessonLearningStateSchema.parse({
      completedSteps: 2,
      currentStepId: "next-step",
      currentStepIndex: 3,
      progressPercent: 75,
      status: "in_progress",
      totalSteps: 4,
      version: { curriculumVersionId: "version-1", revision: 1 },
    }),
    status: "advanced" as const,
  },
}

describe("AI feedback HTTP interface", () => {
  it("path scope와 idempotency key, 요청 signal을 application command에 전달한다", async () => {
    const requestFeedback = vi.fn(async () => ok(successResult))
    const controller = new AbortController()
    const app = createFixture({ requestFeedback })

    const response = await app.request(path, {
      headers: {
        Cookie: "learner=active",
        "Idempotency-Key": "request-1",
      },
      method: "POST",
      signal: controller.signal,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toContain("no-store")
    await expect(response.json()).resolves.toEqual(successResult)
    expect(requestFeedback).toHaveBeenCalledWith(
      {
        idempotencyKey: "request-1",
        learnerId: "learner-1",
        lessonId: "lesson-1",
        stepId: "feedback-step",
      },
      { signal: controller.signal }
    )
  })

  it("unauthenticated와 inactive learner를 application 호출 전에 거절한다", async () => {
    const requestFeedback = vi.fn(async () => ok(successResult))
    const app = createFixture({ requestFeedback })

    const unauthenticated = await app.request(path, {
      headers: { "Idempotency-Key": "request-1" },
      method: "POST",
    })
    const inactive = await app.request(path, {
      headers: {
        Cookie: "learner=inactive",
        "Idempotency-Key": "request-1",
      },
      method: "POST",
    })

    expect(unauthenticated.status).toBe(401)
    expect(inactive.status).toBe(403)
    expect(requestFeedback).not.toHaveBeenCalled()
  })

  it("idempotency key가 없으면 application 호출 전에 400으로 거절한다", async () => {
    const requestFeedback = vi.fn(async () => ok(successResult))
    const app = createFixture({ requestFeedback })

    const response = await app.request(path, {
      headers: { Cookie: "learner=active" },
      method: "POST",
    })

    expect(response.status).toBe(400)
    expect(requestFeedback).not.toHaveBeenCalled()
  })

  it("진행 중 lease에는 실제 남은 초를 Retry-After로 반환한다", async () => {
    const app = createFixture({
      requestFeedback: async () =>
        err({
          kind: "attempt-in-progress",
          remainingAttempts: 2,
          retryAfterSeconds: 17,
        }),
    })

    const response = await request(app)

    expect(response.status).toBe(409)
    expect(response.headers.get("retry-after")).toBe("17")
    await expect(response.json()).resolves.toMatchObject({
      code: "ATTEMPT_IN_PROGRESS",
    })
  })

  it("영구 attempt 제한은 안정된 code를 반환하고 잘못된 Retry-After를 만들지 않는다", async () => {
    const app = createFixture({
      requestFeedback: async () =>
        err({ kind: "attempt-limit-exceeded", remainingAttempts: 0 }),
    })

    const response = await request(app)

    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBeNull()
    await expect(response.json()).resolves.toMatchObject({
      code: "ATTEMPT_LIMIT_EXCEEDED",
    })
  })

  it("provider 실패 응답에는 provider 원문과 prompt를 포함하지 않는다", async () => {
    const app = createFixture({
      requestFeedback: async () => err({ kind: "provider-response-invalid" }),
    })

    const response = await request(app)
    const body = await response.text()

    expect(response.status).toBe(503)
    expect(body).toContain("PROVIDER_UNAVAILABLE")
    expect(body).not.toContain("secret-provider-output")
    expect(body).not.toContain("학습자가 저장한 답변")
  })
})

function createFixture(
  command: AiFeedbackHttpCommandPort,
  session: AiFeedbackLearnerSessionPort = {
    async resolveLearner(headers) {
      const cookie = headers.get("Cookie")
      if (cookie === null) return null
      if (cookie === "learner=inactive") return { kind: "inactive" }
      return {
        kind: "active",
        learnerId: learnerIdSchema.parse("learner-1"),
      }
    },
  }
) {
  return createApp({ routes: createAiFeedbackRoutes({ command, session }) })
}

function request(app: ReturnType<typeof createFixture>) {
  return app.request(path, {
    headers: {
      Cookie: "learner=active",
      "Idempotency-Key": "request-1",
    },
    method: "POST",
  })
}
