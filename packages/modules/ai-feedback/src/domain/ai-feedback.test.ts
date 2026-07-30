import { describe, expect, it } from "vitest"

import { validateAiFeedbackProviderResponse } from "#ai-feedback/domain/ai-feedback"
import {
  calculateRemainingAiFeedbackAttempts,
  defaultAiFeedbackAttemptPolicy,
  transitionAiFeedbackAttempt,
  validateAiFeedbackAttemptPolicy,
  type AiFeedbackAttemptStatus,
} from "#ai-feedback/domain/ai-feedback-attempt"
import {
  createAsiaSeoulQuotaWindow,
  defaultAiFeedbackDailyQuotaPolicy,
  validateAiFeedbackDailyQuotaPolicy,
} from "#ai-feedback/domain/ai-feedback-quota"

type AttemptTransition = Readonly<{
  from: AiFeedbackAttemptStatus
  to: AiFeedbackAttemptStatus
}>

const allowedAttemptTransitions = [
  { from: "pending", to: "succeeded" },
  { from: "pending", to: "failed" },
  { from: "pending", to: "expired" },
] as const satisfies readonly AttemptTransition[]

const rejectedAttemptTransitions = [
  { from: "pending", to: "pending" },
  { from: "succeeded", to: "pending" },
  { from: "succeeded", to: "succeeded" },
  { from: "succeeded", to: "failed" },
  { from: "succeeded", to: "expired" },
  { from: "failed", to: "pending" },
  { from: "failed", to: "succeeded" },
  { from: "failed", to: "failed" },
  { from: "failed", to: "expired" },
  { from: "expired", to: "pending" },
  { from: "expired", to: "succeeded" },
  { from: "expired", to: "failed" },
  { from: "expired", to: "expired" },
] as const satisfies readonly AttemptTransition[]

const coachingResponse = {
  improvements: ["근거를 더 구체화하세요."],
  nextAction: "예시 한 문장을 추가하세요.",
  strengths: ["주장이 명확합니다."],
  summary: "좋은 초안입니다.",
}

describe("AI feedback domain", () => {
  it("허용된 4개 key만 담긴 provider 결과를 coaching shape로 통과시킨다", () => {
    expect(
      validateAiFeedbackProviderResponse(coachingResponse)._unsafeUnwrap()
    ).toEqual(coachingResponse)
  })

  it("nextAction이 상한 4000자면 provider 결과를 통과시킨다", () => {
    expect(
      validateAiFeedbackProviderResponse({
        ...coachingResponse,
        nextAction: "가".repeat(4_000),
      })._unsafeUnwrap().nextAction
    ).toHaveLength(4_000)
  })

  it.each([
    {
      case: "점수 필드가 섞이면",
      response: { ...coachingResponse, score: 80 },
    },
    {
      case: "provider 원문 필드가 섞이면",
      response: { ...coachingResponse, providerRaw: "노출하면 안 되는 원문" },
    },
    {
      case: "nextAction이 상한을 1자 넘기면",
      response: { ...coachingResponse, nextAction: "가".repeat(4_001) },
    },
  ])("$case provider 결과를 거절한다", ({ response }) => {
    expect(
      validateAiFeedbackProviderResponse(response)._unsafeUnwrapErr()
    ).toEqual({ kind: "provider-response-invalid" })
  })

  it("provider timeout이 pending TTL보다 짧지 않은 정책을 거절한다", () => {
    expect(
      validateAiFeedbackAttemptPolicy({
        ...defaultAiFeedbackAttemptPolicy,
        providerTimeoutMs: defaultAiFeedbackAttemptPolicy.pendingTtlMs,
      })._unsafeUnwrapErr()
    ).toEqual({ kind: "attempt-policy-invalid" })
  })

  it("완료 시도가 한도를 넘으면 남은 시도를 음수 없이 0으로 계산한다", () => {
    expect(
      calculateRemainingAiFeedbackAttempts({
        completedAttempts: 4,
        policy: defaultAiFeedbackAttemptPolicy,
      })
    ).toBe(0)
  })

  it.each(allowedAttemptTransitions)(
    "$from → $to 상태 전이를 허용한다",
    ({ from, to }) => {
      expect(transitionAiFeedbackAttempt(from, to)._unsafeUnwrap()).toBe(to)
    }
  )

  it.each(rejectedAttemptTransitions)(
    "$from → $to 상태 전이를 거절한다",
    ({ from, to }) => {
      expect(transitionAiFeedbackAttempt(from, to)._unsafeUnwrapErr()).toEqual({
        kind: "invalid-attempt-transition",
      })
    }
  )
  it("일일 success limit이 request limit보다 크면 quota 정책을 거절한다", () => {
    expect(
      validateAiFeedbackDailyQuotaPolicy({
        ...defaultAiFeedbackDailyQuotaPolicy,
        userDailyRequestLimit: 1,
        userDailySuccessLimit: 2,
      })._unsafeUnwrapErr()
    ).toEqual({ kind: "daily-quota-policy-invalid" })
  })

  it("Asia/Seoul 자정 직전에는 같은 quota 날짜와 1초 Retry-After를 준다", () => {
    expect(
      createAsiaSeoulQuotaWindow(new Date("2026-07-23T14:59:59.250Z"))
    ).toEqual({
      date: "2026-07-23",
      retryAfterSeconds: 1,
    })
  })

  it("Asia/Seoul 자정에는 다음 quota 날짜와 하루치 Retry-After를 준다", () => {
    expect(
      createAsiaSeoulQuotaWindow(new Date("2026-07-23T15:00:00.000Z"))
    ).toEqual({
      date: "2026-07-24",
      retryAfterSeconds: 86_400,
    })
  })
})
