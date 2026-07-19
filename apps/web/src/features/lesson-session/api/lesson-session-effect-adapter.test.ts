import { describe, expect, it, vi } from "vitest"

import { createLessonSessionEffects } from "@/features/lesson-session/api/lesson-session-effect-adapter"
import type { LessonSessionApi } from "@/features/lesson-session/api/lesson-session-api"
import {
  learnerCompleteStepResponseSchema,
  learnerStartLessonResponseSchema,
} from "@workspace/contracts/learning"
import { httpApiOk as apiOk } from "@workspace/http-client"

describe("createLessonSessionEffects", () => {
  it("lesson-scoped 전이 명령에 공통 식별자를 결합한다", async () => {
    const start = learnerStartLessonResponseSchema.parse({
      completedSteps: 0,
      currentStepId: "step-1",
      currentStepIndex: 0,
      progressPercent: 0,
      status: "in_progress",
      totalSteps: 2,
      version: { curriculumVersionId: "version-1", revision: 1 },
    })
    const advanced = learnerCompleteStepResponseSchema.parse({
      evaluation: null,
      learning: {
        ...start,
        completedSteps: 1,
        currentStepId: "step-2",
        currentStepIndex: 1,
        progressPercent: 50,
      },
      status: "advanced",
    })
    const startLesson = vi.fn(async () => apiOk(start))
    const completeStep = vi.fn(async () => apiOk(advanced))
    const api = createApi({ completeStep, startLesson })
    const effects = createLessonSessionEffects(api, {
      expectedCurriculumVersionId: "version-1",
      lessonId: "lesson-1",
    })

    await effects.start()
    await effects.completeStep({
      request: { kind: "acknowledge" },
      stepId: "step-1",
    })

    expect(startLesson).toHaveBeenCalledWith({
      expectedCurriculumVersionId: "version-1",
      lessonId: "lesson-1",
    })
    expect(completeStep).toHaveBeenCalledWith({
      lessonId: "lesson-1",
      request: { kind: "acknowledge" },
      stepId: "step-1",
    })
  })
})

function createApi(overrides: Partial<LessonSessionApi>): LessonSessionApi {
  const unavailable = async () => {
    throw new Error("호출되지 않아야 합니다.")
  }
  return {
    completeStep: vi.fn(unavailable),
    requestAiFeedback: vi.fn(unavailable),
    startLesson: vi.fn(unavailable),
    ...overrides,
  }
}
