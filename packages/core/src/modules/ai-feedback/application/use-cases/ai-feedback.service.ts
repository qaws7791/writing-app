import type { ContentRepository } from "@workspace/core/modules/content/application/ports/content.repository"
import { lessonDtoSchema } from "@workspace/core/modules/content/domain/content.dto"
import {
  aiFeedbackPayloadSchema,
  createAiFeedbackCommandSchema,
  type CreateAiFeedbackCommand,
  type AiFeedbackResultDto,
} from "@workspace/core/modules/ai-feedback/domain/ai-feedback.dto"
import {
  aiFeedbackAttemptPolicySchema,
  type AiFeedbackAttemptPolicy,
} from "@workspace/core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import type { AiFeedbackProvider } from "@workspace/core/modules/ai-feedback/application/ports/ai-feedback.provider"
import { createAiFeedbackPrompt } from "@workspace/core/modules/ai-feedback/domain/ai-feedback.prompt"
import type { AiFeedbackRepository } from "@workspace/core/modules/ai-feedback/application/ports/ai-feedback.repository"
import { err, ok, type Result } from "@workspace/core/shared/result"

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
  provider,
}: {
  readonly contentRepository: ContentRepository
  readonly attemptPolicy: AiFeedbackAttemptPolicy
  readonly feedbackRepository: AiFeedbackRepository
  readonly provider: AiFeedbackProvider
}): AiFeedbackService {
  const parsedAttemptPolicy = aiFeedbackAttemptPolicySchema.parse(attemptPolicy)

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
      const step = parsedLesson.steps.find(
        (candidate) => candidate.id === parsedCommand.stepId
      )

      if (step === undefined) {
        return err({
          kind: "invalid-request",
          reason: "step-not-found-in-lesson",
          stepId: parsedCommand.stepId,
        })
      }

      if (step.type !== "AI_FEEDBACK") {
        return err({
          kind: "invalid-request",
          reason: "step-feedback-not-supported",
          stepId: parsedCommand.stepId,
        })
      }

      const completedAttempts = await feedbackRepository.countCompletedAttempts(
        {
          lessonId: parsedCommand.lessonId,
          stepId: parsedCommand.stepId,
          userId: parsedCommand.userId,
        }
      )
      const remainingAttempts = Math.max(
        0,
        parsedAttemptPolicy.maxCompletedAttempts - completedAttempts
      )

      if (remainingAttempts === 0) {
        return err({
          kind: "attempt-limit-exceeded",
          remainingAttempts: 0,
        })
      }

      const providerResult = await provider.createFeedback(
        createAiFeedbackPrompt({
          answer: parsedCommand.answer,
          focus: step.focus,
          lessonTitle: parsedLesson.title,
        })
      )

      if (providerResult.kind === "err") {
        return err({
          kind: "provider-failed",
          remainingAttempts,
        })
      }

      const result = aiFeedbackPayloadSchema.parse(providerResult.value)
      const saveResult = await feedbackRepository.saveCompletedAttempt(
        {
          ...parsedCommand,
          result,
        },
        parsedAttemptPolicy.maxCompletedAttempts
      )

      if (saveResult.kind === "limit-exceeded") {
        return err({
          kind: "attempt-limit-exceeded",
          remainingAttempts: 0,
        })
      }

      return ok({
        ...result,
        remainingAttempts:
          parsedAttemptPolicy.maxCompletedAttempts - saveResult.attemptNumber,
      })
    },
  }
}
