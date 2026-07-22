import type {
  AiFeedbackPayload,
  AiFeedbackResultDto,
} from "@workspace/contracts/ai-feedback/feedback"
import type { LearnerId, LessonId, LessonStepId } from "@workspace/types/ids"
import type { AiFeedbackAttemptPolicy } from "#core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import type { AiFeedbackProvider } from "#core/modules/ai-feedback/application/ports/ai-feedback.provider"
import type { AiFeedbackRepository } from "#core/modules/ai-feedback/application/ports/ai-feedback.repository"
import {
  createAiFeedbackAttemptCoordinator,
  type AiFeedbackAttemptContext,
  type AiFeedbackAttemptTransitionEvent,
} from "#core/modules/ai-feedback/application/use-cases/ai-feedback-attempt-coordinator"
import { err, ok, type Result } from "@workspace/kernel/result"

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

export type LearnerAiFeedbackTransitionResult<TTransitionResult> = {
  readonly feedback: AiFeedbackResultDto
  readonly transition: TTransitionResult
}

export type LearnerAiFeedbackTransitionService<
  TTransitionError,
  TTransitionResult,
> = {
  readonly createFeedback: (
    command: CreateAiFeedbackApplicationCommand,
    options?: { readonly signal?: AbortSignal }
  ) => Promise<
    Result<
      LearnerAiFeedbackTransitionResult<TTransitionResult>,
      AiFeedbackServiceError | TTransitionError
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

export type AiFeedbackLearningTransition<TTransitionError, TTransitionResult> =
  {
    readonly completeAiFeedbackStep: (command: {
      readonly attemptId: string
      readonly feedback: AiFeedbackPayload
      readonly lessonId: LessonId
      readonly occurredAt: Date
      readonly stepId: LessonStepId
      readonly userId: LearnerId
    }) => Promise<Result<TTransitionResult, TTransitionError>>
    readonly prepareAiFeedback: (
      command: CreateAiFeedbackApplicationCommand
    ) => Promise<
      Result<
        AiFeedbackAttemptContext & { readonly answer: string },
        TTransitionError
      >
    >
  }

export function createLearnerAiFeedbackTransitionService<
  TTransitionError,
  TTransitionResult,
>({
  attemptPolicy,
  feedbackRepository,
  learnerTransitionRepository,
  onAttemptTransition,
  provider,
}: {
  readonly attemptPolicy: AiFeedbackAttemptPolicy
  readonly feedbackRepository: AiFeedbackRepository
  readonly learnerTransitionRepository: AiFeedbackLearningTransition<
    TTransitionError,
    TTransitionResult
  >
  readonly onAttemptTransition?: (
    event: AiFeedbackAttemptTransitionEvent
  ) => void
  readonly provider: AiFeedbackProvider
}): LearnerAiFeedbackTransitionService<TTransitionError, TTransitionResult> {
  const attemptCoordinator = createAiFeedbackAttemptCoordinator({
    attemptPolicy,
    feedbackRepository,
    onAttemptTransition,
    provider,
  })

  return {
    async createFeedback(command, options) {
      const preparation =
        await learnerTransitionRepository.prepareAiFeedback(command)
      if (preparation.isErr()) return err(preparation.error)
      let transition: TTransitionResult | null = null
      let transitionError: TTransitionError | null = null
      const feedback = await attemptCoordinator.createAttempt(
        { ...command, answer: preparation.value.answer },
        {
          focus: preparation.value.focus,
          lessonTitle: preparation.value.lessonTitle,
        },
        {
          signal: options?.signal,
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
            if (result.isErr()) {
              transitionError = result.error
              return false
            }
            transition = result.value
            return true
          },
        }
      )

      if (transitionError !== null) return err(transitionError)
      if (feedback.isErr()) return err(feedback.error)
      if (transition === null) {
        throw new Error("AI feedback transition result was not finalized")
      }
      return ok({ feedback: feedback.value, transition })
    },
  }
}
