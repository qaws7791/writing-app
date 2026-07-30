import { describe, expect, it } from "vitest"

import {
  jsonValueSchema,
  learningAnswerTextMaxLength,
} from "#contracts/learning/answer"
import { learnerStepSubmissionSchema } from "#contracts/learning/learner-transition"

function nestArrays(depth: number): unknown {
  let value: unknown = "값"

  for (let level = 0; level < depth; level += 1) {
    value = [value]
  }

  return value
}

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

  it.each([
    ["허용 깊이", 16, true],
    ["허용 깊이 초과", 17, false],
  ])("JSON %s(%i단)을 %s로 판정한다", (_label, depth, accepted) => {
    expect(jsonValueSchema.safeParse(nestArrays(depth)).success).toBe(accepted)
  })

  it("허용 노드 수를 초과한 JSON 값을 거절한다", () => {
    const wideValue = Array.from({ length: 100 }, () =>
      Array.from({ length: 20 }, (_, index) => index)
    )

    expect(jsonValueSchema.safeParse(wideValue).success).toBe(false)
  })

  it.each([
    ["허용 상한", 100, true],
    ["상한 초과", 101, false],
  ])("JSON 배열 길이 %s(%i개)를 %s로 판정한다", (_label, length, accepted) => {
    expect(
      jsonValueSchema.safeParse(Array.from({ length }, () => 1)).success
    ).toBe(accepted)
  })
})
