import { describe, expect, it } from "vitest"

import {
  aiFeedbackAttemptPolicySchema,
  calculateRemainingAiFeedbackAttempts,
  defaultAiFeedbackAttemptPolicy,
} from "#core/modules/ai-feedback/domain/ai-feedback-attempt-policy"

describe("AI 피드백 시도 정책", () => {
  it("기본 완료 시도 한도와 정책 shape를 명시한다", () => {
    expect(
      aiFeedbackAttemptPolicySchema.parse(defaultAiFeedbackAttemptPolicy)
    ).toEqual({
      maxCompletedAttempts: 3,
      pendingTtlMs: 60_000,
      providerTimeoutMs: 30_000,
    })
    expect(
      aiFeedbackAttemptPolicySchema.safeParse({
        ...defaultAiFeedbackAttemptPolicy,
        maxCompletedAttempts: 0,
      }).success
    ).toBe(false)
    expect(
      aiFeedbackAttemptPolicySchema.safeParse({
        ...defaultAiFeedbackAttemptPolicy,
        providerTimeoutMs: 60_000,
      }).success
    ).toBe(false)
  })

  it("완료된 시도 수에서 남은 시도 횟수를 음수 없이 계산한다", () => {
    expect(
      calculateRemainingAiFeedbackAttempts({
        attemptPolicy: defaultAiFeedbackAttemptPolicy,
        completedAttempts: 1,
      })
    ).toBe(2)

    expect(
      calculateRemainingAiFeedbackAttempts({
        attemptPolicy: defaultAiFeedbackAttemptPolicy,
        completedAttempts: 4,
      })
    ).toBe(0)
  })
})
