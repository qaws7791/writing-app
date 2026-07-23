import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import { err, ok, type Result } from "@workspace/kernel/result"

import type { AiFeedback } from "#ai-feedback/domain/ai-feedback"
import { createAiFeedback } from "#ai-feedback/domain/ai-feedback"
import {
  calculateRemainingAiFeedbackAttempts,
  defaultAiFeedbackAttemptPolicy,
  transitionAiFeedbackAttempt,
  validateAiFeedbackAttemptPolicy,
  type AiFeedbackAttemptId,
  type AiFeedbackAttemptPolicy,
} from "#ai-feedback/domain/ai-feedback-attempt"
import type { AiFeedbackError } from "#ai-feedback/domain/ai-feedback-error"
import { createAiFeedbackPrompt } from "#ai-feedback/domain/ai-feedback-prompt"
import type { AiFeedbackProvider } from "#ai-feedback/application/ports/ai-feedback-provider"
import type {
  AiFeedbackAttemptScope,
  AiFeedbackAttemptTransition,
  AiFeedbackRepository,
  FinalizeAiFeedbackAttemptInput,
  FinalizeAiFeedbackAttemptResult,
} from "#ai-feedback/application/ports/ai-feedback-repository"

export type { AiFeedbackAttemptTransition } from "#ai-feedback/application/ports/ai-feedback-repository"

export type RequestAiFeedbackInput = AiFeedbackAttemptScope &
  Readonly<{
    answer: string
    focus: string
    idempotencyKey: string
    lessonTitle: string
    showScore: boolean
  }>

export type AiFeedbackResult = AiFeedback &
  Readonly<{ remainingAttempts: number }>

export type RequestAiFeedbackOptions = Readonly<{
  signal?: AbortSignal
}>

export type AiFeedbackApplication = Readonly<{
  requestFeedback: (
    input: RequestAiFeedbackInput,
    options?: RequestAiFeedbackOptions
  ) => Promise<Result<AiFeedbackResult, AiFeedbackError>>
}>

export type AiFeedbackApplicationDependencies = Readonly<{
  attemptIdGenerator: IdGenerator<AiFeedbackAttemptId>
  attemptPolicy?: AiFeedbackAttemptPolicy
  clock: Clock
  observeAttemptTransition?: (event: AiFeedbackAttemptTransition) => void
  provider: AiFeedbackProvider
  repository: AiFeedbackRepository
  timeoutSignalFactory?: Readonly<{
    create: (timeoutMs: number) => AbortSignal
  }>
}>

export function createAiFeedbackApplication(
  dependencies: AiFeedbackApplicationDependencies
): AiFeedbackApplication {
  const policyResult = validateAiFeedbackAttemptPolicy(
    dependencies.attemptPolicy ?? defaultAiFeedbackAttemptPolicy
  )
  if (policyResult.isErr()) {
    throw new Error("Invalid AI feedback attempt policy")
  }
  const policy = policyResult.value
  const timeoutSignalFactory = dependencies.timeoutSignalFactory ?? {
    create: (timeoutMs: number) => AbortSignal.timeout(timeoutMs),
  }

  return Object.freeze({
    async requestFeedback(input, options) {
      const createdAt = dependencies.clock.now()
      const reservationResult = await dependencies.repository.reserveAttempt({
        ...scopeOf(input),
        answer: input.answer,
        attemptId: dependencies.attemptIdGenerator.next(),
        createdAt,
        expiresAt: new Date(createdAt.getTime() + policy.pendingTtlMs),
        idempotencyKey: input.idempotencyKey,
        maxCompletedAttempts: policy.maxCompletedAttempts,
      })
      if (reservationResult.isErr()) {
        return persistenceError(reservationResult.error.operation)
      }

      const reservation = reservationResult.value
      for (const expiredAttempt of reservation.expiredAttempts) {
        observeTransition(dependencies, {
          ...expiredAttempt,
          fromStatus: "pending",
          reason: "ttl-expired",
          scope: scopeOf(input),
          toStatus: "expired",
        })
      }

      const remainingAttempts = calculateRemainingAiFeedbackAttempts({
        completedAttempts: reservation.completedAttempts,
        policy,
      })

      switch (reservation.kind) {
        case "already-succeeded":
          return ok(
            withRemainingAttempts(reservation.feedback, remainingAttempts)
          )
        case "already-failed":
          return err({ kind: "provider-unavailable", remainingAttempts })
        case "in-progress":
          return err({
            kind: "attempt-in-progress",
            remainingAttempts,
            retryAfterSeconds: reservation.retryAfterSeconds,
          })
        case "limit-exceeded":
          return err({ kind: "attempt-limit-exceeded", remainingAttempts: 0 })
        case "reserved":
          break
      }

      observeTransition(dependencies, {
        attemptId: reservation.attemptId,
        attemptNumber: reservation.attemptNumber,
        fromStatus: null,
        reason: "reserved",
        scope: scopeOf(input),
        toStatus: "pending",
      })

      const providerResult = await requestProviderFeedback({
        input,
        provider: dependencies.provider,
        signal: options?.signal,
        timeoutSignal: timeoutSignalFactory.create(policy.providerTimeoutMs),
      })

      if (providerResult.isErr()) {
        const failed = await markFailed(dependencies, {
          attemptId: reservation.attemptId,
          occurredAt: dependencies.clock.now(),
        })
        if (failed.isErr()) return err(failed.error)
        if (failed.value.kind === "transitioned") {
          observeTransition(dependencies, {
            attemptId: reservation.attemptId,
            attemptNumber: reservation.attemptNumber,
            fromStatus: "pending",
            reason: "provider-failed",
            scope: scopeOf(input),
            toStatus: "failed",
          })
        }
        return err({ ...providerResult.error, remainingAttempts })
      }

      const feedback = createAiFeedback(providerResult.value, input.showScore)
      const succeeded = await dependencies.repository.markAttemptSucceeded({
        attemptId: reservation.attemptId,
        feedback,
        occurredAt: dependencies.clock.now(),
      })
      if (succeeded.isErr() || succeeded.value.kind === "not-pending") {
        await markFailed(dependencies, {
          attemptId: reservation.attemptId,
          occurredAt: dependencies.clock.now(),
        })
        return persistenceError("succeed-attempt")
      }

      observeTransition(dependencies, {
        attemptId: reservation.attemptId,
        attemptNumber: reservation.attemptNumber,
        fromStatus: "pending",
        reason: "provider-succeeded",
        scope: scopeOf(input),
        toStatus: "succeeded",
      })

      return ok(
        withRemainingAttempts(
          feedback,
          calculateRemainingAiFeedbackAttempts({
            completedAttempts: reservation.completedAttempts + 1,
            policy,
          })
        )
      )
    },
  })
}

function withRemainingAttempts(
  feedback: AiFeedback,
  remainingAttempts: number
): AiFeedbackResult {
  return Object.freeze({ ...feedback, remainingAttempts })
}

async function requestProviderFeedback(input: {
  readonly input: RequestAiFeedbackInput
  readonly provider: AiFeedbackProvider
  readonly signal?: AbortSignal
  readonly timeoutSignal: AbortSignal
}) {
  const providerSignal =
    input.signal === undefined
      ? input.timeoutSignal
      : AbortSignal.any([input.signal, input.timeoutSignal])
  let removeAbortListener: () => void = () => undefined

  try {
    const aborted = new Promise<
      Result<never, Readonly<{ kind: "provider-timeout" | "request-aborted" }>>
    >((resolve) => {
      const resolveAbort = () =>
        resolve(
          err({
            kind:
              input.signal?.aborted === true
                ? "request-aborted"
                : "provider-timeout",
          })
        )

      if (providerSignal.aborted) {
        resolveAbort()
        return
      }

      providerSignal.addEventListener("abort", resolveAbort, { once: true })
      removeAbortListener = () =>
        providerSignal.removeEventListener("abort", resolveAbort)
    })
    const request = input.provider
      .createFeedback(
        createAiFeedbackPrompt({
          answer: input.input.answer,
          focus: input.input.focus,
          lessonTitle: input.input.lessonTitle,
        }),
        { signal: providerSignal }
      )
      .catch(() => err({ kind: "provider-unavailable" as const }))

    return await Promise.race([request, aborted])
  } finally {
    removeAbortListener()
  }
}

async function markFailed(
  dependencies: AiFeedbackApplicationDependencies,
  input: FinalizeAiFeedbackAttemptInput
): Promise<Result<FinalizeAiFeedbackAttemptResult, AiFeedbackError>> {
  const result = await dependencies.repository.markAttemptFailed(input)
  return result.isErr()
    ? persistenceError(result.error.operation)
    : ok(result.value)
}

function persistenceError(
  operation: "fail-attempt" | "reserve-attempt" | "succeed-attempt"
): Result<never, AiFeedbackError> {
  return err({ kind: "persistence-failed", operation })
}

function observeTransition(
  dependencies: AiFeedbackApplicationDependencies,
  event: AiFeedbackAttemptTransition
): void {
  if (
    event.fromStatus !== null &&
    transitionAiFeedbackAttempt(event.fromStatus, event.toStatus).isErr()
  ) {
    throw new Error("Invalid AI feedback attempt transition")
  }
  dependencies.observeAttemptTransition?.(Object.freeze(event))
}

function scopeOf(input: RequestAiFeedbackInput): AiFeedbackAttemptScope {
  return Object.freeze({
    courseId: input.courseId,
    curriculumVersionId: input.curriculumVersionId,
    learnerId: input.learnerId,
    lessonId: input.lessonId,
    stepId: input.stepId,
  })
}
