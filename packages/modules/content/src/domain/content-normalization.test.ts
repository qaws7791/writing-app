import { describe, expect, it } from "vitest"

import {
  normalizeVersionedStepContent,
  normalizeVersionedStepContentOrThrow,
} from "#content/domain/content-normalization"

describe("content normalization policy", () => {
  it.each([
    [
      "FILL_BLANK",
      "words",
      "wordIds",
      ["하나", "둘"],
      { answer: ["둘"] },
      ["step-1:word:2"],
    ],
    [
      "SELECT",
      "segments",
      "segmentIds",
      ["하나", "둘"],
      { correct: [1] },
      ["step-1:segment:2"],
    ],
    [
      "ORDER",
      "items",
      "itemIds",
      ["하나", "둘"],
      { correct: ["둘", "하나"] },
      ["step-1:item:2", "step-1:item:1"],
    ],
  ] as const)(
    "%s 항목과 정답을 stable ID로 결정적으로 정규화한다",
    (type, field, idField, values, solution, expectedSolution) => {
      const first = normalizeVersionedStepContentOrThrow(
        "step-1",
        type,
        JSON.stringify({ [field]: values, ...solution })
      )
      const second = normalizeVersionedStepContentOrThrow("step-1", type, first)

      expect(second).toBe(first)
      expect(JSON.parse(first)).toMatchObject({
        [Object.keys(solution)[0] as string]: expectedSolution,
        [idField]: [
          "step-1:" + idField.replace("Ids", "") + ":1",
          "step-1:" + idField.replace("Ids", "") + ":2",
        ],
      })
    }
  )

  it("중복 표시 문자열도 순서가 아니라 각 stable ID로 정규화한다", () => {
    const normalized = normalizeVersionedStepContentOrThrow(
      "step-duplicate",
      "ORDER",
      JSON.stringify({
        correct: ["같음", "같음"],
        itemIds: ["item-a", "item-b"],
        items: ["같음", "같음"],
      })
    )

    expect(JSON.parse(normalized).correct).toEqual(["item-a", "item-b"])
  })

  it("object가 아닌 JSON을 validation failure로 반환한다", () => {
    expect(
      normalizeVersionedStepContent(
        "step-1",
        "READING",
        "[]"
      )._unsafeUnwrapErr()
    ).toEqual({
      kind: "content-validation-failed",
      reason: "invalid-step-content",
    })
  })
})
