import {
  aiFeedbackPayloadSchema,
  type AiFeedbackPayload,
  type AiFeedbackResultDto,
  type CreateAiFeedbackCommand,
} from "@workspace/core/modules/ai-feedback/domain/ai-feedback.dto"
import {
  aiFeedbackAttemptPolicySchema,
  calculateRemainingAiFeedbackAttempts,
  type AiFeedbackAttemptPolicy,
} from "@workspace/core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import type { AiFeedbackProvider } from "@workspace/core/modules/ai-feedback/application/ports/ai-feedback.provider"
import { createAiFeedbackPrompt } from "@workspace/core/modules/ai-feedback/domain/ai-feedback.prompt"
import type { AiFeedbackRepository } from "@workspace/core/modules/ai-feedback/application/ports/ai-feedback.repository"
import { err, ok, type Result } from "@workspace/core/shared/result"

export type AiFeedbackAttemptContext = {
  readonly focus: string
  readonly lessonTitle: string
}

export type AiFeedbackAttemptCoordinatorError =
  | {
      readonly kind: "attempt-limit-exceeded"
      readonly remainingAttempts: 0
    }
  | {
      readonly kind: "provider-failed"
      readonly remainingAttempts: number
    }

export type AiFeedbackAttemptCoordinator = {
  readonly createAttempt: (
    command: CreateAiFeedbackCommand,
    context: AiFeedbackAttemptContext
  ) => Promise<Result<AiFeedbackResultDto, AiFeedbackAttemptCoordinatorError>>
}

export function createAiFeedbackAttemptCoordinator({
  attemptPolicy,
  feedbackRepository,
  provider,
}: {
  readonly attemptPolicy: AiFeedbackAttemptPolicy
  readonly feedbackRepository: AiFeedbackRepository
  readonly provider: AiFeedbackProvider
}): AiFeedbackAttemptCoordinator {
  const parsedAttemptPolicy = aiFeedbackAttemptPolicySchema.parse(attemptPolicy)

  return {
    async createAttempt(command, context) {
      const completedAttempts = await feedbackRepository.countCompletedAttempts(
        {
          lessonId: command.lessonId,
          stepId: command.stepId,
          userId: command.userId,
        }
      )
      const remainingAttempts = calculateRemainingAiFeedbackAttempts({
        attemptPolicy: parsedAttemptPolicy,
        completedAttempts,
      })

      if (remainingAttempts === 0) {
        return err({
          kind: "attempt-limit-exceeded",
          remainingAttempts: 0,
        })
      }

      const providerResult = await requestAiFeedback({
        command,
        context,
        provider,
      })

      if (providerResult.kind === "err") {
        return err({
          kind: "provider-failed",
          remainingAttempts,
        })
      }

      const saveResult = await feedbackRepository.saveCompletedAttempt(
        {
          ...command,
          result: providerResult.value,
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
        ...providerResult.value,
        remainingAttempts: calculateRemainingAiFeedbackAttempts({
          attemptPolicy: parsedAttemptPolicy,
          completedAttempts: saveResult.attemptNumber,
        }),
      })
    },
  }
}

async function requestAiFeedback({
  command,
  context,
  provider,
}: {
  readonly command: CreateAiFeedbackCommand
  readonly context: AiFeedbackAttemptContext
  readonly provider: AiFeedbackProvider
}): Promise<Result<AiFeedbackPayload, { readonly kind: "provider-failed" }>> {
  const providerResult = await provider.createFeedback(
    createAiFeedbackPrompt({
      answer: command.answer,
      focus: context.focus,
      lessonTitle: context.lessonTitle,
    })
  )

  if (providerResult.kind === "err") {
    return err({ kind: "provider-failed" })
  }

  return ok(aiFeedbackPayloadSchema.parse(providerResult.value))
}
