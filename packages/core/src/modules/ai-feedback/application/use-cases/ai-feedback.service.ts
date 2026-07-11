import type { ContentRepository } from "@workspace/core/modules/content/application/ports/content.repository"
import { lessonDtoSchema } from "@workspace/core/modules/content/domain/content.dto"
import {
  createAiFeedbackCommandSchema,
  type CreateAiFeedbackCommand,
  type AiFeedbackResultDto,
} from "@workspace/core/modules/ai-feedback/domain/ai-feedback.dto"
import type { AiFeedbackAttemptPolicy } from "@workspace/core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import type { AiFeedbackProvider } from "@workspace/core/modules/ai-feedback/application/ports/ai-feedback.provider"
import type { AiFeedbackRepository } from "@workspace/core/modules/ai-feedback/application/ports/ai-feedback.repository"
import { resolveAiFeedbackStep } from "@workspace/core/modules/ai-feedback/domain/ai-feedback-step-policy"
import {
  createAiFeedbackAttemptCoordinator,
  type AiFeedbackAttemptTransitionEvent,
} from "@workspace/core/modules/ai-feedback/application/use-cases/ai-feedback-attempt-coordinator"
import { err, type Result } from "@workspace/core/shared/result"

export type AiFeedbackServiceError =
  | {
      readonly kind: "lesson-not-found"
      readonly lessonId: CreateAiFeedbackCommand["lessonId"]
    }
  | {
      readonly kind: "invalid-request"
      readonly reason:
        | "step-feedback-not-supported"
        | "step-not-found-in-lesson"
      readonly stepId: CreateAiFeedbackCommand["stepId"]
    }
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

export type AiFeedbackService = {
  readonly createFeedback: (
    command: CreateAiFeedbackCommand
  ) => Promise<Result<AiFeedbackResultDto, AiFeedbackServiceError>>
}

export function createAiFeedbackService({
  contentRepository,
  attemptPolicy,
  feedbackRepository,
  onAttemptTransition,
  provider,
}: {
  readonly contentRepository: ContentRepository
  readonly attemptPolicy: AiFeedbackAttemptPolicy
  readonly feedbackRepository: AiFeedbackRepository
  readonly onAttemptTransition?: (
    event: AiFeedbackAttemptTransitionEvent
  ) => void
  readonly provider: AiFeedbackProvider
}): AiFeedbackService {
  const attemptCoordinator = createAiFeedbackAttemptCoordinator({
    attemptPolicy,
    feedbackRepository,
    onAttemptTransition,
    provider,
  })

  return {
    async createFeedback(command) {
      const parsedCommand = createAiFeedbackCommandSchema.parse(command)
      const lesson = await contentRepository.findLesson(parsedCommand.lessonId)

      if (lesson === null) {
        return err({
          kind: "lesson-not-found",
          lessonId: parsedCommand.lessonId,
        })
      }

      const parsedLesson = lessonDtoSchema.parse(lesson)
      const stepResolution = resolveAiFeedbackStep({
        lesson: parsedLesson,
        stepId: parsedCommand.stepId,
      })

      if (stepResolution.kind === "rejected") {
        return err({
          kind: "invalid-request",
          reason: stepResolution.reason,
          stepId: stepResolution.stepId,
        })
      }

      return attemptCoordinator.createAttempt(parsedCommand, {
        focus: stepResolution.step.focus,
        lessonTitle: parsedLesson.title,
      })
    },
  }
}
