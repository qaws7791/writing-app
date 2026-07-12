import {
  aiFeedbackPayloadSchema,
  type AiFeedbackPayload,
  type AiFeedbackResultDto,
  type CreateAiFeedbackCommand,
} from "#core/modules/ai-feedback/domain/ai-feedback.dto"
import {
  aiFeedbackAttemptPolicySchema,
  calculateRemainingAiFeedbackAttempts,
  type AiFeedbackAttemptPolicy,
} from "#core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import type { AiFeedbackProvider } from "#core/modules/ai-feedback/application/ports/ai-feedback.provider"
import { createAiFeedbackPrompt } from "#core/modules/ai-feedback/domain/ai-feedback.prompt"
import type {
  AiFeedbackAttemptStatus,
  AiFeedbackRepository,
} from "#core/modules/ai-feedback/application/ports/ai-feedback.repository"
import { err, ok, type Result } from "#core/shared/result"

export type AiFeedbackAttemptContext = {
  readonly focus: string
  readonly lessonTitle: string
}

export type AiFeedbackAttemptTransitionEvent = {
  readonly attemptId: string
  readonly attemptNumber: number
  readonly event: "ai.feedback.attempt.transition"
  readonly fromStatus: AiFeedbackAttemptStatus | null
  readonly lessonId: string
  readonly reason:
    | "provider-failed"
    | "provider-succeeded"
    | "reserved"
    | "ttl-expired"
  readonly stepId: string
  readonly toStatus: AiFeedbackAttemptStatus
  readonly userId: string
}

export type AiFeedbackAttemptCoordinatorError =
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

export type AiFeedbackAttemptCoordinator = {
  readonly createAttempt: (
    command: CreateAiFeedbackCommand,
    context: AiFeedbackAttemptContext
  ) => Promise<Result<AiFeedbackResultDto, AiFeedbackAttemptCoordinatorError>>
}

export function createAiFeedbackAttemptCoordinator({
  attemptPolicy,
  createAttemptId = () => crypto.randomUUID(),
  feedbackRepository,
  now = () => new Date(),
  onAttemptTransition,
  provider,
}: {
  readonly attemptPolicy: AiFeedbackAttemptPolicy
  readonly createAttemptId?: () => string
  readonly feedbackRepository: AiFeedbackRepository
  readonly now?: () => Date
  readonly onAttemptTransition?: (
    event: AiFeedbackAttemptTransitionEvent
  ) => void
  readonly provider: AiFeedbackProvider
}): AiFeedbackAttemptCoordinator {
  const parsedAttemptPolicy = aiFeedbackAttemptPolicySchema.parse(attemptPolicy)

  return {
    async createAttempt(command, context) {
      const reservation = await feedbackRepository.reserveAttempt({
        ...command,
        attemptId: createAttemptId(),
        expiresAt: new Date(
          command.occurredAt.getTime() + parsedAttemptPolicy.pendingTtlMs
        ),
        maxCompletedAttempts: parsedAttemptPolicy.maxCompletedAttempts,
      })

      for (const expiredAttempt of reservation.expiredAttempts) {
        onAttemptTransition?.({
          ...attemptScope(command),
          ...expiredAttempt,
          event: "ai.feedback.attempt.transition",
          fromStatus: "pending",
          reason: "ttl-expired",
          toStatus: "expired",
        })
      }

      const remainingAttempts = calculateRemainingAiFeedbackAttempts({
        attemptPolicy: parsedAttemptPolicy,
        completedAttempts: reservation.completedAttempts,
      })

      if (reservation.kind === "already-succeeded") {
        return ok({
          ...reservation.result,
          remainingAttempts,
        })
      }

      if (reservation.kind === "already-failed") {
        return err({ kind: "provider-failed", remainingAttempts })
      }

      if (reservation.kind === "in-progress") {
        return err({ kind: "attempt-in-progress", remainingAttempts })
      }

      if (reservation.kind === "limit-exceeded") {
        return err({
          kind: "attempt-limit-exceeded",
          remainingAttempts: 0,
        })
      }

      onAttemptTransition?.({
        ...attemptScope(command),
        attemptId: reservation.attemptId,
        attemptNumber: reservation.attemptNumber,
        event: "ai.feedback.attempt.transition",
        fromStatus: null,
        reason: "reserved",
        toStatus: "pending",
      })

      const providerResult = await requestAiFeedback({
        command,
        context,
        provider,
        timeoutMs: parsedAttemptPolicy.providerTimeoutMs,
      })

      if (providerResult.kind === "err") {
        const transitioned = await feedbackRepository.markAttemptFailed({
          attemptId: reservation.attemptId,
          occurredAt: now(),
        })

        if (transitioned) {
          onAttemptTransition?.({
            ...attemptScope(command),
            attemptId: reservation.attemptId,
            attemptNumber: reservation.attemptNumber,
            event: "ai.feedback.attempt.transition",
            fromStatus: "pending",
            reason: "provider-failed",
            toStatus: "failed",
          })
        }

        return err({ kind: "provider-failed", remainingAttempts })
      }

      const transitioned = await feedbackRepository.markAttemptSucceeded({
        attemptId: reservation.attemptId,
        occurredAt: now(),
        result: providerResult.value,
      })

      if (!transitioned) {
        return err({ kind: "provider-failed", remainingAttempts })
      }

      onAttemptTransition?.({
        ...attemptScope(command),
        attemptId: reservation.attemptId,
        attemptNumber: reservation.attemptNumber,
        event: "ai.feedback.attempt.transition",
        fromStatus: "pending",
        reason: "provider-succeeded",
        toStatus: "succeeded",
      })

      return ok({
        ...providerResult.value,
        remainingAttempts: calculateRemainingAiFeedbackAttempts({
          attemptPolicy: parsedAttemptPolicy,
          completedAttempts: reservation.completedAttempts + 1,
        }),
      })
    },
  }
}

async function requestAiFeedback({
  command,
  context,
  provider,
  timeoutMs,
}: {
  readonly command: CreateAiFeedbackCommand
  readonly context: AiFeedbackAttemptContext
  readonly provider: AiFeedbackProvider
  readonly timeoutMs: number
}): Promise<Result<AiFeedbackPayload, { readonly kind: "provider-failed" }>> {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    const providerResult = await Promise.race([
      provider.createFeedback(
        createAiFeedbackPrompt({
          answer: command.answer,
          focus: context.focus,
          lessonTitle: context.lessonTitle,
        })
      ),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("AI feedback provider timeout")),
          timeoutMs
        )
      }),
    ])

    if (providerResult.kind === "err") {
      return err({ kind: "provider-failed" })
    }

    return ok(aiFeedbackPayloadSchema.parse(providerResult.value))
  } catch {
    return err({ kind: "provider-failed" })
  } finally {
    if (timeout !== undefined) clearTimeout(timeout)
  }
}

function attemptScope(command: CreateAiFeedbackCommand) {
  return {
    lessonId: command.lessonId,
    stepId: command.stepId,
    userId: command.userId,
  }
}
