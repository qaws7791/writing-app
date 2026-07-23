import { describe, expect, it, vi } from "vitest"
import { err, ok } from "@workspace/kernel/result"
import type {
  CourseId,
  CurriculumVersionId,
  LearnerId,
  LessonId,
  LessonStepId,
} from "@workspace/types/ids"

import {
  createAiFeedbackApplication,
  type AiFeedbackApplicationDependencies,
} from "#ai-feedback/application/ai-feedback-application"
import type { AiFeedbackRepository } from "#ai-feedback/application/ports/ai-feedback-repository"
import { createAiFeedbackAttemptId } from "#ai-feedback/domain/ai-feedback-attempt"

const now = new Date("2026-07-23T00:00:00.000Z")
const request = {
  answer: "학습자가 저장한 답변",
  courseId: "course-1" as CourseId,
  curriculumVersionId: "version-1" as CurriculumVersionId,
  focus: "명확성",
  idempotencyKey: "request-1",
  learnerId: "learner-1" as LearnerId,
  lessonId: "lesson-1" as LessonId,
  lessonTitle: "좋은 문장",
  showScore: true,
  stepId: "step-2" as LessonStepId,
}
const providerResponse = {
  improvements: ["근거를 보강하세요."],
  nextAction: "예시를 추가하세요.",
  score: 80,
  strengths: ["주장이 명확합니다."],
  summary: "좋은 초안입니다.",
} as const

describe("AI feedback application", () => {
  it("attempt를 예약한 뒤 provider를 호출하고 성공 결과를 저장한다", async () => {
    const calls: string[] = []
    const transitions: unknown[] = []
    const application = createApplication({
      observeAttemptTransition: (event) => transitions.push(event),
      provider: {
        async createFeedback(prompt) {
          calls.push(`provider:${prompt.policyVersion}`)
          return ok(providerResponse)
        },
      },
      repository: repository({ calls }),
    })

    await expect(application.requestFeedback(request)).resolves.toEqual(
      ok({
        ...providerResponse,
        remainingAttempts: 2,
        scoreRange: [0, 100],
        showScore: true,
      })
    )
    expect(calls).toEqual([
      "repository:reserve",
      "provider:writing-coach-v1",
      "repository:succeed",
    ])
    expect(transitions).toEqual([
      expect.objectContaining({ reason: "reserved", toStatus: "pending" }),
      expect.objectContaining({
        reason: "provider-succeeded",
        toStatus: "succeeded",
      }),
    ])
    const observed = JSON.stringify(transitions)
    expect(observed).not.toContain(request.answer)
    expect(observed).not.toContain(request.focus)
    expect(observed).not.toContain(request.lessonTitle)
    expect(observed).not.toContain("writing-coach-v1")
  })

  it.each([
    "provider-response-invalid",
    "provider-timeout",
    "provider-unavailable",
    "request-aborted",
  ] as const)(
    "%s를 값으로 반환하고 완료 quota를 소모하지 않는다",
    async (kind) => {
      const application = createApplication({
        provider: {
          async createFeedback() {
            return err({ kind })
          },
        },
      })

      await expect(application.requestFeedback(request)).resolves.toEqual(
        err({ kind, remainingAttempts: 3 })
      )
    }
  )

  it("caller abort를 provider가 무시해도 즉시 취소하고 failed로 전이한다", async () => {
    const caller = new AbortController()
    const started = deferred<void>()
    let providerSignal: AbortSignal | undefined
    const application = createApplication({
      provider: {
        async createFeedback(_prompt, options) {
          providerSignal = options.signal
          started.resolve()
          return new Promise<never>(() => undefined)
        },
      },
    })

    const result = application.requestFeedback(request, {
      signal: caller.signal,
    })
    await started.promise
    caller.abort()

    await expect(result).resolves.toEqual(
      err({ kind: "request-aborted", remainingAttempts: 3 })
    )
    expect(providerSignal?.aborted).toBe(true)
  })

  it("provider timeout signal을 별도 오류로 반환한다", async () => {
    const timeout = new AbortController()
    const started = deferred<void>()
    const application = createApplication({
      provider: {
        async createFeedback() {
          started.resolve()
          return new Promise<never>(() => undefined)
        },
      },
      timeoutSignalFactory: { create: () => timeout.signal },
    })

    const result = application.requestFeedback(request)
    await started.promise
    timeout.abort()

    await expect(result).resolves.toEqual(
      err({ kind: "provider-timeout", remainingAttempts: 3 })
    )
  })

  it("provider 성공 뒤 저장 실패는 provider를 재호출하지 않고 보상 실패 전이를 시도한다", async () => {
    const provider = vi.fn(async () => ok(providerResponse))
    const markAttemptFailed = vi.fn(async () =>
      ok({ kind: "transitioned" as const })
    )
    const application = createApplication({
      provider: { createFeedback: provider },
      repository: repository({
        markAttemptFailed,
        markAttemptSucceeded: async () =>
          err({
            cause: new Error("database unavailable"),
            kind: "ai-feedback-persistence-failed",
            operation: "succeed-attempt",
          }),
      }),
    })

    await expect(application.requestFeedback(request)).resolves.toEqual(
      err({ kind: "persistence-failed", operation: "succeed-attempt" })
    )
    expect(provider).toHaveBeenCalledTimes(1)
    expect(markAttemptFailed).toHaveBeenCalledTimes(1)
  })

  it("예약 persistence 실패에서는 provider를 호출하지 않는다", async () => {
    const provider = vi.fn(async () => ok(providerResponse))
    const application = createApplication({
      provider: { createFeedback: provider },
      repository: repository({
        reserveAttempt: async () =>
          err({
            cause: new Error("database unavailable"),
            kind: "ai-feedback-persistence-failed",
            operation: "reserve-attempt",
          }),
      }),
    })

    await expect(application.requestFeedback(request)).resolves.toEqual(
      err({ kind: "persistence-failed", operation: "reserve-attempt" })
    )
    expect(provider).not.toHaveBeenCalled()
  })
})

function createApplication(
  overrides: Partial<AiFeedbackApplicationDependencies> = {}
) {
  return createAiFeedbackApplication({
    attemptIdGenerator: { next: () => createAiFeedbackAttemptId("attempt-1") },
    clock: { now: () => now },
    provider: {
      async createFeedback() {
        return ok(providerResponse)
      },
    },
    repository: repository(),
    timeoutSignalFactory: {
      create: () => new AbortController().signal,
    },
    ...overrides,
  })
}

function repository(
  overrides: Partial<AiFeedbackRepository> & {
    readonly calls?: string[]
  } = {}
): AiFeedbackRepository {
  return {
    async markAttemptFailed(input) {
      overrides.calls?.push("repository:fail")
      return (
        overrides.markAttemptFailed?.(input) ??
        ok({ kind: "transitioned" as const })
      )
    },
    async markAttemptSucceeded(input) {
      overrides.calls?.push("repository:succeed")
      return (
        overrides.markAttemptSucceeded?.(input) ??
        ok({ kind: "transitioned" as const })
      )
    },
    async reserveAttempt(input) {
      overrides.calls?.push("repository:reserve")
      return (
        overrides.reserveAttempt?.(input) ??
        ok({
          attemptId: input.attemptId,
          attemptNumber: 1,
          completedAttempts: 0,
          expiredAttempts: [],
          kind: "reserved" as const,
        })
      )
    },
  }
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}
