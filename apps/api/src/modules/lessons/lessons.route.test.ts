import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import { LearnerLessonPersistedDataCorruptionError } from "@/adapters/learning/learner-read-persisted-data"
import { createTestDependencies } from "@/routes/test-dependencies"

describe("플랫폼 API lessons route", () => {
  it("인증된 사용자가 lesson 상세를 조회한다", async () => {
    const app = createApp(createTestDependencies())

    const response = await app.request("/lessons/l1", {
      headers: {
        Cookie: "learner_session_token=active-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      courseId: "c1",
      id: "l1",
      steps: [
        {
          id: "l1-s1",
          type: "READING",
        },
      ],
      title: "좋은 문장이란 무엇인가",
    })
  })

  it("persisted JSON 손상은 내부 세부 정보 없이 기존 500 계약으로 응답한다", async () => {
    const dependencies = createTestDependencies()
    const internalErrors: { readonly errorClass: string }[] = []
    const app = createApp({
      ...dependencies,
      contentService: {
        ...dependencies.contentService,
        async getLesson() {
          throw new LearnerLessonPersistedDataCorruptionError({
            field: "lesson-step-content",
            lessonId: "l1",
            reason: "invalid-json",
            stepId: "l1-s1",
          })
        },
      },
      errorLogger(error) {
        internalErrors.push(error)
      },
    })

    const response = await app.request("/lessons/l1", {
      headers: {
        Cookie: "learner_session_token=active-token",
      },
    })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "서버 오류가 발생했습니다.",
      requestId: response.headers.get("x-request-id"),
    })
    expect(internalErrors).toEqual([
      expect.objectContaining({
        errorClass: "LearnerLessonPersistedDataCorruptionError",
      }),
    ])
  })
})
