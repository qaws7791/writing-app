import { describe, expect, it, vi } from "vitest"

import { createLessonSessionEffects } from "@/features/lessons/lesson-session-effect-adapter"
import { networkApiError } from "@/lib/api/api-error"
import { apiFailure, apiOk } from "@/lib/api/api-result"
import type { WritingAppApi } from "@/lib/api/writing-app-api-port"
import { createHttpNetworkError } from "@workspace/http-client"

describe("레슨 세션 effect Adapter", () => {
  it("시작 답안 저장이 실패하면 진행 위치를 저장하지 않는다", async () => {
    const saveLessonProgress = vi.fn(async () => apiOk({ saved: true }))
    const effects = createLessonSessionEffects(
      createApi({
        saveLessonAnswer: vi.fn(async () =>
          apiFailure({ code: "contract-error", message: "저장 실패" })
        ),
        saveLessonProgress,
      }),
      "lesson-1"
    )

    await expect(effects.start("step-1")).resolves.toEqual({
      status: "error",
    })
    expect(saveLessonProgress).not.toHaveBeenCalled()
  })

  it("시작 답안 뒤 진행 위치 저장 실패를 하나의 실패로 반환한다", async () => {
    const effects = createLessonSessionEffects(
      createApi({
        saveLessonAnswer: vi.fn(async () => apiOk({ saved: true })),
        saveLessonProgress: vi.fn(async () =>
          apiFailure({ code: "contract-error", message: "진행 저장 실패" })
        ),
      }),
      "lesson-1"
    )

    await expect(effects.start("step-1")).resolves.toEqual({
      status: "error",
    })
  })

  it("network AI 피드백 실패만 동일 idempotency key로 재시도하게 표시한다", async () => {
    const effects = createLessonSessionEffects(
      createApi({
        createAiFeedback: vi.fn(async () =>
          apiFailure({
            ...networkApiError(
              createHttpNetworkError(
                new Request("https://api.example.test/feedback"),
                new TypeError("test network failure")
              )
            ),
            message: "연결 실패",
          })
        ),
      }),
      "lesson-1"
    )

    await expect(
      effects.requestAiFeedback({
        answer: "답안",
        idempotencyKey: "same-key",
        stepId: "step-1",
      })
    ).resolves.toEqual({
      message: "연결 실패",
      retryable: true,
      status: "error",
    })
  })
})

function createApi(overrides: Partial<WritingAppApi>): WritingAppApi {
  const unavailable = async () =>
    apiFailure({
      code: "contract-error",
      message: "테스트에서 사용하지 않는 API입니다.",
    })

  return {
    completeLesson: vi.fn(unavailable),
    createAiFeedback: vi.fn(unavailable),
    getCourseDetail: vi.fn(unavailable),
    getLesson: vi.fn(unavailable),
    getProfile: vi.fn(unavailable),
    getProgress: vi.fn(unavailable),
    listCourses: vi.fn(unavailable),
    saveLessonAnswer: vi.fn(unavailable),
    saveLessonProgress: vi.fn(unavailable),
    ...overrides,
  }
}
