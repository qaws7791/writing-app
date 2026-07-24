import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import { err, ok, type Result } from "@workspace/kernel/result"

import type { AiFeedback } from "#ai-feedback/domain/ai-feedback"
import { createAiFeedback } from "#ai-feedback/domain/ai-feedback"
import {
  calculateRemainingAiFeedbackAttempts,
  defaultAiFeedbackAttemptPolicy,
  transitionAiFeedbackAttempt,
  validateAiFeedbackAttemptPolicy,
  type AiFeedbackFailureCode,
  type AiFeedbackAttemptId,
  type AiFeedbackAttemptPolicy,
} from "#ai-feedback/domain/ai-feedback-attempt"
import type { AiFeedbackError } from "#ai-feedback/domain/ai-feedback-error"
import {
  createAiFeedbackPrompt,
  type AiFeedbackPrompt,
} from "#ai-feedback/domain/ai-feedback-prompt"
import {
  createAsiaSeoulQuotaWindow,
  defaultAiFeedbackDailyQuotaPolicy,
  validateAiFeedbackDailyQuotaPolicy,
  type AiFeedbackDailyQuotaPolicy,
} from "#ai-feedback/domain/ai-feedback-quota"
import type {
  AiFeedbackProvider,
  AiFeedbackProviderError,
  AiFeedbackProviderSuccess,
} from "#ai-feedback/application/ports/ai-feedback-provider"
import type {
  AiFeedbackAttemptScope,
  AiFeedbackAttemptTransition,
  AiFeedbackRepository,
  FinalizeAiFeedbackAttemptResult,
} from "#ai-feedback/application/ports/ai-feedback-repository"

export type { AiFeedbackAttemptTransition } from "#ai-feedback/application/ports/ai-feedback-repository"

export type RequestAiFeedbackInput = AiFeedbackAttemptScope &
  Readonly<{
    answer: string
    focus: string
    idempotencyKey: string
    lessonTitle: string
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

export type AiFeedbackUsageEvent = Readonly<{
  failureCode?: AiFeedbackFailureCode
  inputTokens?: number
  latencyMs: number
  model: string
  outcome: "failed" | "succeeded"
  outputTokens?: number
  promptPolicyVersion: string
  provider: string
}>

type AiFeedbackAttemptExecution = Readonly<{
  inputTokenCount?: number
  latencyMs: number
  outputTokenCount?: number
}>

export type AiFeedbackApplicationDependencies = Readonly<{
  attemptIdGenerator: IdGenerator<AiFeedbackAttemptId>
  attemptPolicy?: AiFeedbackAttemptPolicy
  clock: Clock
  dailyQuotaPolicy?: AiFeedbackDailyQuotaPolicy
  observeAttemptTransition?: (event: AiFeedbackAttemptTransition) => void
  observeUsage?: (event: AiFeedbackUsageEvent) => void
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
  const dailyQuotaPolicyResult = validateAiFeedbackDailyQuotaPolicy(
    dependencies.dailyQuotaPolicy ?? defaultAiFeedbackDailyQuotaPolicy
  )
  if (dailyQuotaPolicyResult.isErr()) {
    throw new Error("Invalid AI feedback daily quota policy")
  }
  const dailyQuotaPolicy = dailyQuotaPolicyResult.value
  const timeoutSignalFactory = dependencies.timeoutSignalFactory ?? {
    create: (timeoutMs: number) => AbortSignal.timeout(timeoutMs),
  }

  return {
    async requestFeedback(input, options) {
      const createdAt = dependencies.clock.now()
      const prompt = createAiFeedbackPrompt({
        answer: input.answer,
        focus: input.focus,
        lessonTitle: input.lessonTitle,
      })
      const quotaWindow = createAsiaSeoulQuotaWindow(createdAt)
      const reservationResult = await dependencies.repository.reserveAttempt({
        ...scopeOf(input),
        answer: input.answer,
        attemptId: dependencies.attemptIdGenerator.next(),
        createdAt,
        expiresAt: new Date(createdAt.getTime() + policy.pendingTtlMs),
        idempotencyKey: input.idempotencyKey,
        maxCompletedAttempts: policy.maxCompletedAttempts,
        model: dependencies.provider.model,
        promptPolicyVersion: prompt.policyVersion,
        quotaDate: quotaWindow.date,
        quotaPolicy: dailyQuotaPolicy,
        quotaRetryAfterSeconds: quotaWindow.retryAfterSeconds,
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
          return err(replayFailure(reservation.failureCode, remainingAttempts))
        case "daily-quota-exceeded":
          return err({
            kind: "daily-quota-exceeded",
            remainingAttempts,
            retryAfterSeconds: reservation.retryAfterSeconds,
          })
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

      const providerStartedAt = dependencies.clock.now()
      const providerResult = await requestProviderFeedback({
        prompt,
        provider: dependencies.provider,
        signal: options?.signal,
        timeoutSignal: timeoutSignalFactory.create(policy.providerTimeoutMs),
      })
      const providerFinishedAt = dependencies.clock.now()
      const execution = createAttemptExecution({
        finishedAt: providerFinishedAt,
        providerResult,
        startedAt: providerStartedAt,
      })

      if (providerResult.isErr()) {
        const failed = await markFailed(dependencies, {
          attemptId: reservation.attemptId,
          failureCode: providerResult.error.kind,
          ...execution,
          occurredAt: providerFinishedAt,
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
          observeUsage(dependencies, {
            ...execution,
            failureCode: providerResult.error.kind,
            model: dependencies.provider.model,
            outcome: "failed",
            promptPolicyVersion: prompt.policyVersion,
            provider: dependencies.provider.provider,
          })
        }
        return err({ kind: providerResult.error.kind, remainingAttempts })
      }

      const feedback = createAiFeedback(providerResult.value.feedback)
      const succeeded = await dependencies.repository.markAttemptSucceeded({
        attemptId: reservation.attemptId,
        feedback,
        ...execution,
        occurredAt: providerFinishedAt,
      })
      if (succeeded.isErr() || succeeded.value.kind === "not-pending") {
        await markFailed(dependencies, {
          attemptId: reservation.attemptId,
          failureCode: "persistence-failed",
          ...execution,
          occurredAt: providerFinishedAt,
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
      observeUsage(dependencies, {
        ...execution,
        model: dependencies.provider.model,
        outcome: "succeeded",
        promptPolicyVersion: prompt.policyVersion,
        provider: dependencies.provider.provider,
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
  }
}

function withRemainingAttempts(
  feedback: AiFeedback,
  remainingAttempts: number
): AiFeedbackResult {
  return { ...feedback, remainingAttempts }
}

async function requestProviderFeedback(input: {
  readonly prompt: AiFeedbackPrompt
  readonly provider: AiFeedbackProvider
  readonly signal?: AbortSignal
  readonly timeoutSignal: AbortSignal
}): Promise<Result<AiFeedbackProviderSuccess, AiFeedbackProviderError>> {
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
      .createFeedback(input.prompt, { signal: providerSignal })
      .catch(() => err({ kind: "provider-unavailable" as const }))

    return await Promise.race([request, aborted])
  } finally {
    removeAbortListener()
  }
}

function createAttemptExecution(input: {
  readonly finishedAt: Date
  readonly providerResult: Result<
    AiFeedbackProviderSuccess,
    AiFeedbackProviderError
  >
  readonly startedAt: Date
}): AiFeedbackAttemptExecution {
  const usage = input.providerResult.isOk()
    ? input.providerResult.value.usage
    : input.providerResult.error.usage

  return {
    ...(usage === undefined
      ? {}
      : {
          inputTokenCount: usage.inputTokens,
          outputTokenCount: usage.outputTokens,
        }),
    latencyMs: Math.max(
      0,
      Math.round(input.finishedAt.getTime() - input.startedAt.getTime())
    ),
  }
}

function replayFailure(
  failureCode: AiFeedbackFailureCode,
  remainingAttempts: number
): AiFeedbackError {
  if (failureCode === "persistence-failed") {
    return { kind: "provider-unavailable", remainingAttempts }
  }
  return {
    kind: failureCode === "pending-expired" ? "provider-timeout" : failureCode,
    remainingAttempts,
  }
}

async function markFailed(
  dependencies: AiFeedbackApplicationDependencies,
  input: Parameters<AiFeedbackRepository["markAttemptFailed"]>[0]
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
  dependencies.observeAttemptTransition?.(event)
}

function observeUsage(
  dependencies: AiFeedbackApplicationDependencies,
  event: Omit<AiFeedbackUsageEvent, "inputTokens" | "outputTokens"> &
    AiFeedbackAttemptExecution
): void {
  const { inputTokenCount, outputTokenCount, ...metadata } = event
  dependencies.observeUsage?.({
    ...metadata,
    ...(inputTokenCount === undefined ? {} : { inputTokens: inputTokenCount }),
    ...(outputTokenCount === undefined
      ? {}
      : { outputTokens: outputTokenCount }),
  })
}

function scopeOf(input: RequestAiFeedbackInput): AiFeedbackAttemptScope {
  return {
    courseId: input.courseId,
    curriculumVersionId: input.curriculumVersionId,
    learnerId: input.learnerId,
    lessonId: input.lessonId,
    stepId: input.stepId,
  }
}

export { defaultAiFeedbackAttemptPolicy, defaultAiFeedbackDailyQuotaPolicy }
export type { AiFeedbackAttemptPolicy, AiFeedbackDailyQuotaPolicy }
