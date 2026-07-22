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
} from "#ai-feedback/domain/ai-feedback-attempt"
import { isAiFeedbackErrorRetryable } from "#ai-feedback/domain/ai-feedback-error"

describe("AI feedback domain", () => {
  it("provider 결과를 허용된 한국어 coaching shape와 점수 범위로 제한한다", () => {
    const response = validateAiFeedbackProviderResponse({
      improvements: ["근거를 더 구체화하세요."],
      nextAction: "예시 한 문장을 추가하세요.",
      score: 82,
      strengths: ["주장이 명확합니다."],
      summary: "좋은 초안입니다.",
    })

    expect(response.isOk()).toBe(true)
    if (response.isErr()) return
    expect(createAiFeedback(response.value, false)).toEqual({
      ...response.value,
      scoreRange: [0, 100],
      showScore: false,
    })
    expect(
      validateAiFeedbackProviderResponse({
        improvements: ["개선점"],
        nextAction: "다음 행동",
        score: 101,
        strengths: ["강점"],
        summary: "요약",
      })
    ).toEqual({ error: { kind: "provider-response-invalid" } })
    expect(
      validateAiFeedbackProviderResponse({
        improvements: ["개선점"],
        nextAction: "다음 행동",
        providerRaw: "노출하면 안 되는 원문",
        score: 80,
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

  it("pending에서 terminal 상태로만 전이하고 영구 quota만 재시도 불가로 분류한다", () => {
    expect(transitionAiFeedbackAttempt("pending", "succeeded").isOk()).toBe(
      true
    )
    expect(transitionAiFeedbackAttempt("failed", "pending").isErr()).toBe(true)
    expect(
      isAiFeedbackErrorRetryable({
        kind: "attempt-limit-exceeded",
        remainingAttempts: 0,
      })
    ).toBe(false)
    expect(
      isAiFeedbackErrorRetryable({
        kind: "provider-timeout",
        remainingAttempts: 2,
      })
    ).toBe(true)
  })
})
