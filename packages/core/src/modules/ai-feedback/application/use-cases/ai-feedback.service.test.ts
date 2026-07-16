import { describe, expect, it, vi } from "vitest"

import { defaultAiFeedbackAttemptPolicy } from "#core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import { aiFeedbackPayloadSchema } from "#core/modules/ai-feedback/domain/ai-feedback.dto"
import { createLearnerAiFeedbackTransitionService } from "#core/modules/ai-feedback/application/use-cases/ai-feedback.service"
import type { AiFeedbackRepository } from "#core/modules/ai-feedback/application/ports/ai-feedback.repository"
import type { AiFeedbackProvider } from "#core/modules/ai-feedback/application/ports/ai-feedback.provider"
import type { LearnerTransitionRepository } from "#core/modules/learning/application/ports/learner-transition.repository"
import { learnerIdSchema } from "#core/modules/learning/domain/learning.ids"
import { ok } from "#core/shared/result"
import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content"
import { completeLearnerStepResultSchema } from "@workspace/contracts/learning"

describe("LearnerAiFeedbackTransitionService", () => {
  it("고정 version 답안으로 provider를 호출하고 성공 저장과 step 전이를 결합한다", async () => {
    const feedback = aiFeedbackPayloadSchema.parse({
      improvements: ["개선점"],
      nextAction: "다음 행동",
      score: 0,
      scoreRange: [0, 100],
      showScore: false,
      strengths: ["강점"],
      summary: "요약",
    })
    const transition = completeLearnerStepResultSchema.parse({
      evaluation: null,
      learning: {
        completedSteps: 2,
        currentStepId: "step-3",
        currentStepIndex: 2,
        progressPercent: 67,
        status: "in_progress",
        totalSteps: 3,
        version: { curriculumVersionId: "version-1", revision: 1 },
      },
      status: "advanced",
    })
    const provider: AiFeedbackProvider = {
      createFeedback: vi.fn(async () => ok(feedback)),
    }
    const feedbackRepository: AiFeedbackRepository = {
      markAttemptFailed: vi.fn(async () => true),
      markAttemptSucceeded: vi.fn(async () => true),
      reserveAttempt: vi.fn(async (input) => ({
        attemptId: input.attemptId,
        attemptNumber: 1,
        completedAttempts: 0,
        expiredAttempts: [],
        kind: "reserved" as const,
      })),
    }
    const completeAiFeedbackStep = vi.fn(async () => ok(transition))
    const learnerTransitionRepository: LearnerTransitionRepository = {
      completeAiFeedbackStep,
      completeStep: vi.fn(),
      prepareAiFeedback: vi.fn(async () =>
        ok({ answer: "저장된 글", focus: "논리", lessonTitle: "레슨" })
      ),
      startLesson: vi.fn(),
    }
    const service = createLearnerAiFeedbackTransitionService({
      attemptPolicy: defaultAiFeedbackAttemptPolicy,
      feedbackRepository,
      learnerTransitionRepository,
      provider,
    })

    const result = await service.createFeedback({
      idempotencyKey: "feedback-key-1",
      lessonId: lessonIdSchema.parse("lesson-1"),
      occurredAt: new Date("2026-07-17T00:00:00.000Z"),
      stepId: lessonStepIdSchema.parse("step-ai"),
      userId: learnerIdSchema.parse("learner-1"),
    })

    expect(result).toEqual(
      ok({ feedback: { ...feedback, remainingAttempts: 2 }, transition })
    )
    expect(provider.createFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("코칭 초점: 논리"),
      })
    )
    expect(provider.createFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("저장된 글"),
      })
    )
    expect(completeAiFeedbackStep).toHaveBeenCalledTimes(1)
  })
})
