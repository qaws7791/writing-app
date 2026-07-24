import { describe, expect, it } from "vitest"

import {
  createAiFeedback,
  validateAiFeedbackProviderResponse,
} from "#ai-feedback/domain/ai-feedback"
import {
  calculateRemainingAiFeedbackAttempts,
  defaultAiFeedbackAttemptPolicy,
  transitionAiFeedbackAttempt,
  validateAiFeedbackAttemptPolicy,
  type AiFeedbackAttemptStatus,
} from "#ai-feedback/domain/ai-feedback-attempt"
import { isAiFeedbackErrorRetryable } from "#ai-feedback/domain/ai-feedback-error"
import {
  createAsiaSeoulQuotaWindow,
  defaultAiFeedbackDailyQuotaPolicy,
  validateAiFeedbackDailyQuotaPolicy,
} from "#ai-feedback/domain/ai-feedback-quota"

const attemptStatuses = [
  "pending",
  "succeeded",
  "failed",
  "expired",
] as const satisfies readonly AiFeedbackAttemptStatus[]

describe("AI feedback domain", () => {
  it("provider 결과를 허용된 한국어 coaching shape로 제한한다", () => {
    const response = validateAiFeedbackProviderResponse({
      improvements: ["근거를 더 구체화하세요."],
      nextAction: "예시 한 문장을 추가하세요.",
      strengths: ["주장이 명확합니다."],
      summary: "좋은 초안입니다.",
    })

    expect(response.isOk()).toBe(true)
    if (response.isErr()) return
    expect(createAiFeedback(response.value)).toEqual(response.value)
    expect(
      validateAiFeedbackProviderResponse({
        improvements: ["개선점"],
        nextAction: "다음 행동",
        score: 80,
        strengths: ["강점"],
        summary: "요약",
      })
    ).toEqual({ error: { kind: "provider-response-invalid" } })
    expect(
      validateAiFeedbackProviderResponse({
        improvements: ["개선점"],
        nextAction: "다음 행동",
        providerRaw: "노출하면 안 되는 원문",
        strengths: ["강점"],
        summary: "요약",
      })
    ).toEqual({ error: { kind: "provider-response-invalid" } })
    expect(
      validateAiFeedbackProviderResponse({
        improvements: ["개선점"],
        nextAction: "가".repeat(4_001),
        strengths: ["강점"],
        summary: "요약",
      })
    ).toEqual({ error: { kind: "provider-response-invalid" } })
  })

  it("완료 시도 한도, pending TTL과 provider timeout 순서를 검증한다", () => {
    expect(
      validateAiFeedbackAttemptPolicy(defaultAiFeedbackAttemptPolicy).isOk()
    ).toBe(true)
    expect(
      validateAiFeedbackAttemptPolicy({
        ...defaultAiFeedbackAttemptPolicy,
        providerTimeoutMs: defaultAiFeedbackAttemptPolicy.pendingTtlMs,
      }).isErr()
    ).toBe(true)
    expect(
      calculateRemainingAiFeedbackAttempts({
        completedAttempts: 4,
        policy: defaultAiFeedbackAttemptPolicy,
      })
    ).toBe(0)
  })

  it.each(
    attemptStatuses.flatMap((from) =>
      attemptStatuses.map((to) => ({ from, to }))
    )
  )("$from → $to 상태 전이 정책을 적용한다", ({ from, to }) => {
    const allowed = from === "pending" && to !== "pending"
    expect(transitionAiFeedbackAttempt(from, to).isOk()).toBe(allowed)
  })

  it("영구 성공 한도만 즉시 재시도 불가로 분류한다", () => {
    expect(
      isAiFeedbackErrorRetryable({
        kind: "attempt-limit-exceeded",
        remainingAttempts: 0,
      })
    ).toBe(false)
    expect(
      isAiFeedbackErrorRetryable({
        kind: "daily-quota-exceeded",
        remainingAttempts: 2,
        retryAfterSeconds: 60,
      })
    ).toBe(true)
    expect(
      isAiFeedbackErrorRetryable({
        kind: "provider-timeout",
        remainingAttempts: 2,
      })
    ).toBe(true)
  })

  it("일일 quota를 양의 정수와 request 이하 success limit으로 제한한다", () => {
    expect(
      validateAiFeedbackDailyQuotaPolicy(
        defaultAiFeedbackDailyQuotaPolicy
      ).isOk()
    ).toBe(true)
    expect(
      validateAiFeedbackDailyQuotaPolicy({
        ...defaultAiFeedbackDailyQuotaPolicy,
        userDailyRequestLimit: 1,
        userDailySuccessLimit: 2,
      }).isErr()
    ).toBe(true)
  })

  it("Asia/Seoul 자정으로 quota 날짜와 Retry-After를 계산한다", () => {
    expect(
      createAsiaSeoulQuotaWindow(new Date("2026-07-23T14:59:59.250Z"))
    ).toEqual({
      date: "2026-07-23",
      retryAfterSeconds: 1,
    })
    expect(
      createAsiaSeoulQuotaWindow(new Date("2026-07-23T15:00:00.000Z"))
    ).toEqual({
      date: "2026-07-24",
      retryAfterSeconds: 86_400,
    })
  })
})
