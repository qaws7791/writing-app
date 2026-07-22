import { describe, expect, it } from "vitest"

import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import { learnerIdSchema } from "@workspace/contracts/learning/step-data"
import {
  createAiFeedbackAttemptCoordinator,
  type AiFeedbackAttemptTransitionEvent,
} from "#core/modules/ai-feedback/application/use-cases/ai-feedback-attempt-coordinator"
import { defaultAiFeedbackAttemptPolicy } from "#core/modules/ai-feedback/domain/ai-feedback-attempt-policy"
import type { AiFeedbackRepository } from "#core/modules/ai-feedback/application/ports/ai-feedback.repository"
import { err, ok } from "@workspace/kernel/result"
import type { AiFeedbackPayload } from "@workspace/contracts/ai-feedback/feedback"

const occurredAt = new Date("2026-06-14T10:00:00.000Z")
const command = {
  answer: "문장을 더 분명하게 고쳐 보았습니다.",
  idempotencyKey: "request-1",
  lessonId: lessonIdSchema.parse("l1"),
  occurredAt,
  stepId: lessonStepIdSchema.parse("l1-s2"),
  userId: learnerIdSchema.parse("user-1"),
}
const context = {
  focus: "명확성",
  lessonTitle: "좋은 문장이란 무엇인가",
}

describe("AI 피드백 시도 coordinator", () => {
  it("slot을 먼저 예약하고 성공 상태와 구조 이벤트를 남긴다", async () => {
    const transitions: AiFeedbackAttemptTransitionEvent[] = []
    let succeeded = false
    const coordinator = createAiFeedbackAttemptCoordinator({
      attemptPolicy: defaultAiFeedbackAttemptPolicy,
      createAttemptId: () => "attempt-1",
      feedbackRepository: repository({
        markSucceeded() {
          succeeded = true
        },
      }),
      onAttemptTransition: (event) => transitions.push(event),
      provider: {
        async createFeedback() {
          return ok(feedbackPayload)
        },
      },
    })

    await expect(coordinator.createAttempt(command, context)).resolves.toEqual(
      ok({ ...feedbackPayload, remainingAttempts: 2 })
    )
    expect(succeeded).toBe(true)
    expect(transitions).toEqual([
      expect.objectContaining({
        attemptId: "attempt-1",
        fromStatus: null,
        reason: "reserved",
        toStatus: "pending",
      }),
      expect.objectContaining({
        attemptId: "attempt-1",
        fromStatus: "pending",
        reason: "provider-succeeded",
        toStatus: "succeeded",
      }),
    ])
  })

  it("provider fault를 failed로 전이하고 slot을 소모하지 않는다", async () => {
    let failed = false
    const coordinator = createAiFeedbackAttemptCoordinator({
      attemptPolicy: defaultAiFeedbackAttemptPolicy,
      feedbackRepository: repository({
        markFailed() {
          failed = true
        },
      }),
      provider: {
        async createFeedback() {
          return err({ kind: "provider-unavailable" })
        },
      },
    })

    await expect(coordinator.createAttempt(command, context)).resolves.toEqual(
      err({ kind: "provider-failed", remainingAttempts: 3 })
    )
    expect(failed).toBe(true)
  })

  it("호출자가 취소하면 provider가 신호를 무시해도 즉시 failed로 전이한다", async () => {
    let failed = false
    let providerSignal: AbortSignal | undefined
    const providerStarted = createDeferred<void>()
    const callerController = new AbortController()
    const inactiveTimeoutController = new AbortController()
    const coordinator = createAiFeedbackAttemptCoordinator({
      attemptPolicy: defaultAiFeedbackAttemptPolicy,
      createProviderTimeoutSignal: () => inactiveTimeoutController.signal,
      feedbackRepository: repository({
        markFailed() {
          failed = true
        },
      }),
      provider: {
        async createFeedback(_input, options) {
          providerSignal = options?.signal
          providerStarted.resolve()
          return new Promise<never>(() => undefined)
        },
      },
    })

    const attempt = coordinator.createAttempt(command, context, {
      signal: callerController.signal,
    })
    await providerStarted.promise
    expect(providerSignal?.aborted).toBe(false)

    callerController.abort(
      new DOMException("요청이 취소되었습니다.", "AbortError")
    )

    expect(providerSignal?.aborted).toBe(true)
    await expect(attempt).resolves.toEqual(
      err({ kind: "provider-failed", remainingAttempts: 3 })
    )
    expect(failed).toBe(true)
  })

  it("provider timeout 신호가 실제 provider 호출을 취소하고 failed로 전이한다", async () => {
    let failed = false
    let providerSignal: AbortSignal | undefined
    let requestedTimeoutMs: number | undefined
    const providerStarted = createDeferred<void>()
    const timeoutController = new AbortController()
    const coordinator = createAiFeedbackAttemptCoordinator({
      attemptPolicy: {
        maxCompletedAttempts: 3,
        pendingTtlMs: 100,
        providerTimeoutMs: 10,
      },
      createProviderTimeoutSignal(timeoutMs) {
        requestedTimeoutMs = timeoutMs
        return timeoutController.signal
      },
      feedbackRepository: repository({
        markFailed() {
          failed = true
        },
      }),
      provider: {
        async createFeedback(_input, options) {
          providerSignal = options?.signal
          providerStarted.resolve()
          return new Promise<never>(() => undefined)
        },
      },
    })

    const attempt = coordinator.createAttempt(command, context)
    await providerStarted.promise
    expect(requestedTimeoutMs).toBe(10)
    expect(providerSignal?.aborted).toBe(false)

    timeoutController.abort(
      new DOMException("AI feedback provider timeout", "TimeoutError")
    )

    expect(providerSignal?.aborted).toBe(true)
    await expect(attempt).resolves.toEqual(
      err({ kind: "provider-failed", remainingAttempts: 3 })
    )
    expect(failed).toBe(true)
  })

  it("만료 회수와 pending 거절 상태를 구조 이벤트 및 오류로 노출한다", async () => {
    const transitions: AiFeedbackAttemptTransitionEvent[] = []
    const coordinator = createAiFeedbackAttemptCoordinator({
      attemptPolicy: defaultAiFeedbackAttemptPolicy,
      feedbackRepository: repository({
        reservation: {
          completedAttempts: 1,
          expiredAttempts: [{ attemptId: "expired-1", attemptNumber: 2 }],
          kind: "in-progress",
        },
      }),
      onAttemptTransition: (event) => transitions.push(event),
      provider: {
        async createFeedback() {
          return ok(feedbackPayload)
        },
      },
    })

    await expect(coordinator.createAttempt(command, context)).resolves.toEqual(
      err({ kind: "attempt-in-progress", remainingAttempts: 2 })
    )
    expect(transitions).toEqual([
      expect.objectContaining({
        attemptId: "expired-1",
        reason: "ttl-expired",
        toStatus: "expired",
      }),
    ])
  })
})

const feedbackPayload: AiFeedbackPayload = {
  improvements: ["근거를 한 문장 더 붙이면 설득력이 좋아집니다."],
  nextAction: "주장 뒤에 구체적인 예시를 한 가지 추가하세요.",
  score: 82,
  scoreRange: [0, 100],
  showScore: true,
  strengths: ["핵심 문장이 앞에 있어 읽기 쉽습니다."],
  summary: "문장의 의도가 분명합니다.",
}

function repository(
  options: {
    readonly markFailed?: () => void
    readonly markSucceeded?: () => void
    readonly reservation?: Awaited<
      ReturnType<AiFeedbackRepository["reserveAttempt"]>
    >
  } = {}
): AiFeedbackRepository {
  return {
    async markAttemptFailed() {
      options.markFailed?.()
      return true
    },
    async markAttemptSucceeded() {
      options.markSucceeded?.()
      return true
    },
    async reserveAttempt(input) {
      return (
        options.reservation ?? {
          attemptId: input.attemptId,
          attemptNumber: 1,
          completedAttempts: 0,
          expiredAttempts: [],
          kind: "reserved",
        }
      )
    },
  }
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}
