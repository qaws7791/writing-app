import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import { createTestDependencies } from "@/routes/test-dependencies"
import type {
  AiFeedbackService,
  CreateAiFeedbackCommand,
} from "@workspace/core/modules/ai-feedback"

const now = new Date("2026-06-14T11:00:00.000Z")

describe("플랫폼 API AI feedback route", () => {
  it("인증된 사용자의 AI 코칭 요청을 service로 전달한다", async () => {
    const commands: CreateAiFeedbackCommand[] = []
    const app = createApp({
      ...createTestDependencies(),
      aiFeedbackService: createService({
        async createFeedback(command) {
          commands.push(command)

          return {
            kind: "ok",
            value: {
              improvements: ["근거를 한 문장 더 붙이세요."],
              nextAction: "예시를 하나 추가하세요.",
              remainingAttempts: 2,
              score: 84,
              scoreRange: [0, 100],
              showScore: true,
              strengths: ["핵심 문장이 앞에 있습니다."],
              summary: "의도가 분명합니다.",
            },
          }
        },
      }),
      now: () => now,
    })

    const response = await app.request("/ai-feedback", {
      body: JSON.stringify({
        answer: "문장을 명확하게 고쳤습니다.",
        lessonId: "l1",
        stepId: "l1-s2",
      }),
      headers: {
        Cookie: "learner_session_token=active-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        "Idempotency-Key": "request-1",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      improvements: ["근거를 한 문장 더 붙이세요."],
      nextAction: "예시를 하나 추가하세요.",
      remainingAttempts: 2,
      score: 84,
      scoreRange: [0, 100],
      showScore: true,
      strengths: ["핵심 문장이 앞에 있습니다."],
      summary: "의도가 분명합니다.",
    })
    expect(commands).toEqual([
      {
        answer: "문장을 명확하게 고쳤습니다.",
        idempotencyKey: "request-1",
        lessonId: "l1",
        occurredAt: now,
        stepId: "l1-s2",
        userId: "user-1",
      },
    ])
  })

  it("시도 제한 초과는 429로 응답한다", async () => {
    const app = createApp({
      ...createTestDependencies(),
      aiFeedbackService: createService({
        async createFeedback() {
          return {
            error: {
              kind: "attempt-limit-exceeded",
              remainingAttempts: 0,
            },
            kind: "err",
          }
        },
      }),
      now: () => now,
    })

    const response = await app.request("/ai-feedback", {
      body: JSON.stringify({
        answer: "한 번 더 코칭을 요청합니다.",
        lessonId: "l1",
        stepId: "l1-s2",
      }),
      headers: {
        Cookie: "learner_session_token=active-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      method: "POST",
    })

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toEqual({
      code: "ATTEMPT_LIMIT_EXCEEDED",
      message: "Attempt limit exceeded",
    })
  })

  it("같은 범위의 요청을 처리 중이면 409로 응답한다", async () => {
    const app = createApp({
      ...createTestDependencies(),
      aiFeedbackService: createService({
        async createFeedback() {
          return {
            error: {
              kind: "attempt-in-progress",
              remainingAttempts: 2,
            },
            kind: "err",
          }
        },
      }),
      now: () => now,
    })

    const response = await app.request("/ai-feedback", {
      body: JSON.stringify({
        answer: "처리 중인 코칭을 다시 요청합니다.",
        lessonId: "l1",
        stepId: "l1-s2",
      }),
      headers: {
        Cookie: "learner_session_token=active-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        "Idempotency-Key": "request-in-progress",
      },
      method: "POST",
    })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      code: "ATTEMPT_IN_PROGRESS",
      message: "Attempt already in progress",
    })
  })

  it("잘못된 JSON 본문은 HTTP_EXCEPTION으로 응답한다", async () => {
    const app = createApp({
      ...createTestDependencies(),
      aiFeedbackService: createService({
        async createFeedback() {
          return {
            kind: "ok",
            value: {
              improvements: [],
              nextAction: "다시 시도하세요.",
              remainingAttempts: 2,
              score: 0,
              scoreRange: [0, 100],
              showScore: false,
              strengths: [],
              summary: "요청이 처리되지 않아야 합니다.",
            },
          }
        },
      }),
      now: () => now,
    })

    const response = await app.request("/ai-feedback", {
      body: "{",
      headers: {
        Cookie: "learner_session_token=active-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      method: "POST",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: "HTTP_EXCEPTION",
      message: "Bad Request",
    })
  })
})

function createService(service: AiFeedbackService): AiFeedbackService {
  return service
}
