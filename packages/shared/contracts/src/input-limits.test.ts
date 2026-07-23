import { describe, expect, it } from "vitest"

import { jsonValueSchema } from "#contracts/learning/answer"
import { learnerStepSubmissionSchema } from "#contracts/learning/learner-transition"

const oversizedText = "가".repeat(1_000_000)

describe("외부 입력 크기 제한", () => {
  it("쓰기 답안을 제한한다", () => {
    expect(
      learnerStepSubmissionSchema.safeParse({
        text: oversizedText,
        type: "WRITE",
      }).success
    ).toBe(false)
  })

  it("과도하게 깊은 JSON 값을 재귀 호출 없이 거절한다", () => {
    let value: unknown = "값"

    for (let depth = 0; depth < 100; depth += 1) {
      value = [value]
    }

    expect(jsonValueSchema.safeParse(value).success).toBe(false)
  })
})
