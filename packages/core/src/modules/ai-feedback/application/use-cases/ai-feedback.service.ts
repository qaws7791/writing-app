import type { LessonId, LessonStepId } from "@workspace/contracts/content"
import type {
  LearnerAiFeedbackTransitionResult,
  LearnerId,
} from "@workspace/contracts/learning"
import type { AiFeedbackAttemptPolicy } from "#core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import type { AiFeedbackProvider } from "#core/modules/ai-feedback/application/ports/ai-feedback.provider"
import type { AiFeedbackRepository } from "#core/modules/ai-feedback/application/ports/ai-feedback.repository"
import type { LearnerTransitionRepository } from "#core/modules/learning/application/ports/learner-transition.repository"
import type { LearnerTransitionError } from "#core/modules/learning/domain/learner-transition"
import {
  createAiFeedbackAttemptCoordinator,
  type AiFeedbackAttemptTransitionEvent,
} from "#core/modules/ai-feedback/application/use-cases/ai-feedback-attempt-coordinator"
import { err, type Result } from "#core/shared/result"

export type AiFeedbackServiceError =
  | {
      readonly kind: "attempt-limit-exceeded"
      readonly remainingAttempts: 0
    }
  | {
      readonly kind: "attempt-in-progress"
      readonly remainingAttempts: number
    }
  | {
      readonly kind: "provider-failed"
      readonly remainingAttempts: number
    }

export type LearnerAiFeedbackTransitionService = {
  readonly createFeedback: (
    command: CreateAiFeedbackApplicationCommand
  ) => Promise<
    Result<
      LearnerAiFeedbackTransitionResult,
      AiFeedbackServiceError | LearnerTransitionError
    >
  >
}

export type CreateAiFeedbackApplicationCommand = {
  readonly idempotencyKey: string
  readonly lessonId: LessonId
  readonly occurredAt: Date
  readonly stepId: LessonStepId
  readonly userId: LearnerId
}

export function createLearnerAiFeedbackTransitionService({
  attemptPolicy,
  feedbackRepository,
  learnerTransitionRepository,
  onAttemptTransition,
  provider,
}: {
  readonly attemptPolicy: AiFeedbackAttemptPolicy
  readonly feedbackRepository: AiFeedbackRepository
  readonly learnerTransitionRepository: LearnerTransitionRepository
  readonly onAttemptTransition?: (
    event: AiFeedbackAttemptTransitionEvent
  ) => void
  readonly provider: AiFeedbackProvider
}): LearnerAiFeedbackTransitionService {
  const attemptCoordinator = createAiFeedbackAttemptCoordinator({
    attemptPolicy,
    feedbackRepository,
    onAttemptTransition,
    provider,
  })

  return {
    async createFeedback(command) {
      const preparation =
        await learnerTransitionRepository.prepareAiFeedback(command)
      if (preparation.kind === "err") return preparation
      let transition: LearnerAiFeedbackTransitionResult["transition"] | null =
        null
      let transitionError: LearnerTransitionError | null = null
      const feedback = await attemptCoordinator.createAttempt(
        { ...command, answer: preparation.value.answer },
        {
          focus: preparation.value.focus,
          lessonTitle: preparation.value.lessonTitle,
        },
        {
          async finalizeSucceededAttempt(input) {
            const result =
              await learnerTransitionRepository.completeAiFeedbackStep({
                attemptId: input.attemptId,
                feedback: input.result,
                lessonId: command.lessonId,
                occurredAt: input.occurredAt,
                stepId: command.stepId,
                userId: command.userId,
              })
            if (result.kind === "err") {
              transitionError = result.error
              return false
            }
            transition = result.value
            return true
          },
        }
      )

      if (transitionError !== null) return err(transitionError)
      if (feedback.kind === "err") return feedback
      if (transition === null) {
        throw new Error("AI feedback transition result was not finalized")
      }
      return {
        kind: "ok",
        value: { feedback: feedback.value, transition },
      }
    },
  }
}
