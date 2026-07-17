import {
  aiFeedbackPayloadSchema,
  type AiFeedbackPayload,
  type AiFeedbackResultDto,
  type CreateAiFeedbackCommand,
} from "@workspace/contracts/ai-feedback"
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
    context: AiFeedbackAttemptContext,
    options?: AiFeedbackAttemptOptions
  ) => Promise<Result<AiFeedbackResultDto, AiFeedbackAttemptCoordinatorError>>
}

export type AiFeedbackAttemptOptions = {
  readonly finalizeSucceededAttempt?: (input: {
    readonly attemptId: string
    readonly occurredAt: Date
    readonly result: AiFeedbackPayload
  }) => Promise<boolean>
  readonly signal?: AbortSignal
}

export function createAiFeedbackAttemptCoordinator({
  attemptPolicy,
  createAttemptId = () => crypto.randomUUID(),
  createProviderTimeoutSignal = (timeoutMs) => AbortSignal.timeout(timeoutMs),
  feedbackRepository,
  now = () => new Date(),
  onAttemptTransition,
  provider,
}: {
  readonly attemptPolicy: AiFeedbackAttemptPolicy
  readonly createAttemptId?: () => string
  readonly createProviderTimeoutSignal?: (timeoutMs: number) => AbortSignal
  readonly feedbackRepository: AiFeedbackRepository
  readonly now?: () => Date
  readonly onAttemptTransition?: (
    event: AiFeedbackAttemptTransitionEvent
  ) => void
  readonly provider: AiFeedbackProvider
}): AiFeedbackAttemptCoordinator {
  const parsedAttemptPolicy = aiFeedbackAttemptPolicySchema.parse(attemptPolicy)

  return {
    async createAttempt(command, context, options) {
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
        const finalized =
          options?.finalizeSucceededAttempt === undefined ||
          (await options.finalizeSucceededAttempt({
            attemptId: reservation.attemptId,
            occurredAt: now(),
            result: reservation.result,
          }))
        if (!finalized) {
          return err({ kind: "provider-failed", remainingAttempts })
        }
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
        signal: options?.signal,
        timeoutSignal: createProviderTimeoutSignal(
          parsedAttemptPolicy.providerTimeoutMs
        ),
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

      const transitioned = await finalizeSucceededAttempt(
        options,
        feedbackRepository,
        {
          attemptId: reservation.attemptId,
          occurredAt: now(),
          result: providerResult.value,
        }
      )

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

async function finalizeSucceededAttempt(
  options: AiFeedbackAttemptOptions | undefined,
  repository: AiFeedbackRepository,
  input: {
    readonly attemptId: string
    readonly occurredAt: Date
    readonly result: AiFeedbackPayload
  }
): Promise<boolean> {
  return options?.finalizeSucceededAttempt === undefined
    ? repository.markAttemptSucceeded(input)
    : options.finalizeSucceededAttempt(input)
}

async function requestAiFeedback({
  command,
  context,
  provider,
  signal,
  timeoutSignal,
}: {
  readonly command: CreateAiFeedbackCommand
  readonly context: AiFeedbackAttemptContext
  readonly provider: AiFeedbackProvider
  readonly signal?: AbortSignal
  readonly timeoutSignal: AbortSignal
}): Promise<Result<AiFeedbackPayload, { readonly kind: "provider-failed" }>> {
  const providerSignal =
    signal === undefined
      ? timeoutSignal
      : AbortSignal.any([signal, timeoutSignal])
  let removeAbortListener: () => void = () => undefined

  try {
    const aborted = new Promise<never>((_, reject) => {
      if (providerSignal.aborted) {
        reject(providerSignal.reason)
        return
      }

      const onAbort = () => reject(providerSignal.reason)
      providerSignal.addEventListener("abort", onAbort, { once: true })
      removeAbortListener = () =>
        providerSignal.removeEventListener("abort", onAbort)
    })
    const providerResult = await Promise.race([
      provider.createFeedback(
        createAiFeedbackPrompt({
          answer: command.answer,
          focus: context.focus,
          lessonTitle: context.lessonTitle,
        }),
        { signal: providerSignal }
      ),
      aborted,
    ])

    if (providerResult.kind === "err") {
      return err({ kind: "provider-failed" })
    }

    return ok(aiFeedbackPayloadSchema.parse(providerResult.value))
  } catch {
    return err({ kind: "provider-failed" })
  } finally {
    removeAbortListener()
  }
}

function attemptScope(command: CreateAiFeedbackCommand) {
  return {
    lessonId: command.lessonId,
    stepId: command.stepId,
    userId: command.userId,
  }
}
