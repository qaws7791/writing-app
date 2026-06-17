import { describe, expect, it } from "vitest"

import {
  aiFeedbackAttemptPolicySchema,
  defaultAiFeedbackAttemptPolicy,
} from "@/ai-feedback/ai-feedback-attempt-policy"

describe("AI 피드백 시도 정책", () => {
  it("기본 완료 시도 한도와 정책 shape를 명시한다", () => {
    expect(
      aiFeedbackAttemptPolicySchema.parse(defaultAiFeedbackAttemptPolicy)
    ).toEqual({
      maxCompletedAttempts: 3,
    })
    expect(
      aiFeedbackAttemptPolicySchema.safeParse({ maxCompletedAttempts: 0 })
        .success
    ).toBe(false)
  })
})
