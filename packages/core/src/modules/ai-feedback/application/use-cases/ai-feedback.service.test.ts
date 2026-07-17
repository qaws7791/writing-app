import { describe, expect, it, vi } from "vitest"

import { aiFeedbackPayloadSchema } from "@workspace/contracts/ai-feedback"
import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content"
import {
  curriculumVersionIdSchema,
  inProgressLessonLearningStateSchema,
  learnerIdSchema,
} from "@workspace/contracts/learning/step-data"

import type { AiFeedbackProvider } from "#core/modules/ai-feedback/application/ports/ai-feedback.provider"
import type { AiFeedbackRepository } from "#core/modules/ai-feedback/application/ports/ai-feedback.repository"
import { createLearnerAiFeedbackTransitionService } from "#core/modules/ai-feedback/application/use-cases/ai-feedback.service"
import { defaultAiFeedbackAttemptPolicy } from "#core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import { ok } from "#core/shared/result"

describe("LearnerAiFeedbackTransitionService", () => {
  it("고정 version 답안으로 provider를 호출하고 성공 저장과 step 전이를 결합한다", async () => {
    const callerController = new AbortController()
    let providerSignal: AbortSignal | undefined
    const feedback = aiFeedbackPayloadSchema.parse({
      improvements: ["개선점"],
      nextAction: "다음 행동",
      score: 0,
      scoreRange: [0, 100],
      showScore: false,
      strengths: ["강점"],
      summary: "요약",
    })
    const transition = {
      evaluation: null,
      kind: "advanced",
      learning: inProgressLessonLearningStateSchema.parse({
        completedSteps: 2,
        currentStepId: lessonStepIdSchema.parse("step-3"),
        currentStepIndex: 2,
        progressPercent: 67,
        status: "in_progress",
        totalSteps: 3,
        version: {
          curriculumVersionId: curriculumVersionIdSchema.parse("version-1"),
          revision: 1,
        },
      }),
    } as const
    const provider: AiFeedbackProvider = {
      createFeedback: vi.fn(async (_input, options) => {
        providerSignal = options?.signal
        return ok(feedback)
      }),
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
    const learnerTransitionRepository = {
      completeAiFeedbackStep,
      prepareAiFeedback: vi.fn(async () =>
        ok({ answer: "저장된 글", focus: "논리", lessonTitle: "레슨" })
      ),
    }
    const service = createLearnerAiFeedbackTransitionService({
      attemptPolicy: defaultAiFeedbackAttemptPolicy,
      feedbackRepository,
      learnerTransitionRepository,
      provider,
    })

    const result = await service.createFeedback(
      {
        idempotencyKey: "feedback-key-1",
        lessonId: lessonIdSchema.parse("lesson-1"),
        occurredAt: new Date("2026-07-17T00:00:00.000Z"),
        stepId: lessonStepIdSchema.parse("step-ai"),
        userId: learnerIdSchema.parse("learner-1"),
      },
      { signal: callerController.signal }
    )

    expect(result).toEqual(
      ok({ feedback: { ...feedback, remainingAttempts: 2 }, transition })
    )
    const providerInput = vi.mocked(provider.createFeedback).mock.calls[0]?.[0]
    expect(providerInput?.input).toContain("코칭 초점: 논리")
    expect(providerInput?.input).toContain("저장된 글")
    expect(providerSignal?.aborted).toBe(false)
    callerController.abort()
    expect(providerSignal?.aborted).toBe(true)
    expect(completeAiFeedbackStep).toHaveBeenCalledTimes(1)
  })
})
