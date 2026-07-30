import { describe, expect, it } from "vitest"

import { learningAnswerTextMaxLength } from "#contracts/learning/answer"
import { learnerStepSubmissionSchema } from "#contracts/learning/learner-transition"

describe("외부 입력 크기 제한", () => {
  it.each([
    ["허용 상한", learningAnswerTextMaxLength, true],
    ["상한 초과", learningAnswerTextMaxLength + 1, false],
  ])(
    "쓰기 답안 %s 길이를 %i자에서 %s로 판정한다",
    (_label, length, accepted) => {
      expect(
        learnerStepSubmissionSchema.safeParse({
          text: "가".repeat(length),
          type: "WRITE",
        }).success
      ).toBe(accepted)
    }
  )
})
