import type { ContentRepository } from "#core/modules/content/application/ports/content.repository"
import { lessonDtoSchema } from "#core/modules/content/domain/content.dto"
import { type AiFeedbackResultDto } from "#core/modules/ai-feedback/domain/ai-feedback.dto"
import type { LessonId, LessonStepId } from "@workspace/contracts/content"
import type { LearnerId } from "@workspace/contracts/learning"
import type { AiFeedbackAttemptPolicy } from "#core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import type { AiFeedbackProvider } from "#core/modules/ai-feedback/application/ports/ai-feedback.provider"
import type { AiFeedbackRepository } from "#core/modules/ai-feedback/application/ports/ai-feedback.repository"
import type { LearningRepository } from "#core/modules/learning/application/ports/learning.repository"
import { resolveAiFeedbackStep } from "#core/modules/ai-feedback/domain/ai-feedback-step-policy"
import {
  createAiFeedbackAttemptCoordinator,
  type AiFeedbackAttemptTransitionEvent,
} from "#core/modules/ai-feedback/application/use-cases/ai-feedback-attempt-coordinator"
import { err, type Result } from "#core/shared/result"

export type AiFeedbackServiceError =
  | {
      readonly kind: "lesson-not-found"
      readonly lessonId: LessonId
    }
  | {
      readonly kind: "invalid-request"
      readonly reason:
        | "step-feedback-not-supported"
        | "step-not-found-in-lesson"
      readonly stepId: LessonStepId
    }
  | {
      readonly kind: "feedback-target-invalid"
      readonly reason:
        | "target-step-not-before-feedback"
        | "target-step-not-found"
        | "target-step-not-write"
      readonly stepId: LessonStepId
    }
  | {
      readonly kind: "feedback-answer-not-found"
      readonly targetStepId: LessonStepId
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
    command: CreateAiFeedbackApplicationCommand
  ) => Promise<Result<AiFeedbackResultDto, AiFeedbackServiceError>>
}

export type CreateAiFeedbackApplicationCommand = {
  readonly idempotencyKey: string
  readonly lessonId: LessonId
  readonly occurredAt: Date
  readonly stepId: LessonStepId
  readonly userId: LearnerId
}

export function createAiFeedbackService({
  contentRepository,
  attemptPolicy,
  feedbackRepository,
  learningRepository,
  onAttemptTransition,
  provider,
}: {
  readonly contentRepository: ContentRepository
  readonly attemptPolicy: AiFeedbackAttemptPolicy
  readonly feedbackRepository: AiFeedbackRepository
  readonly learningRepository: LearningRepository
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
      const lesson = await contentRepository.findLesson(command.lessonId)

      if (lesson === null) {
        return err({
          kind: "lesson-not-found",
          lessonId: command.lessonId,
        })
      }

      const stepResolution = resolveAiFeedbackStep({
        lesson,
        stepId: command.stepId,
      })

      if (stepResolution.kind === "rejected") {
        if (
          stepResolution.reason === "target-step-not-before-feedback" ||
          stepResolution.reason === "target-step-not-found" ||
          stepResolution.reason === "target-step-not-write"
        ) {
          return err({
            kind: "feedback-target-invalid",
            reason: stepResolution.reason,
            stepId: stepResolution.stepId,
          })
        }

        return err({
          kind: "invalid-request",
          reason: stepResolution.reason,
          stepId: stepResolution.stepId,
        })
      }

      const parsedLesson = lessonDtoSchema.parse(lesson)

      const targetAnswer = await learningRepository.findStepAnswer({
        lessonId: command.lessonId,
        stepId: stepResolution.targetStep.id,
        userId: command.userId,
      })

      if (
        targetAnswer === null ||
        !("type" in targetAnswer) ||
        targetAnswer.type !== "WRITE"
      ) {
        return err({
          kind: "feedback-answer-not-found",
          targetStepId: stepResolution.targetStep.id,
        })
      }

      return attemptCoordinator.createAttempt(
        {
          ...command,
          answer: targetAnswer.text,
        },
        {
          focus: stepResolution.step.focus,
          lessonTitle: parsedLesson.title,
        }
      )
    },
  }
}
