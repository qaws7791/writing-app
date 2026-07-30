import { describe, expect, it } from "vitest"

import {
  normalizeVersionedStepContent,
  normalizeVersionedStepContentOrThrow,
} from "#content/domain/content-normalization"

describe("content normalization policy", () => {
  it.each([
    {
      expectedIds: ["step-1:word:1", "step-1:word:2"],
      expectedSolution: ["step-1:word:2"],
      field: "words",
      idField: "wordIds",
      solution: { answer: ["둘"] },
      type: "FILL_BLANK",
      values: ["하나", "둘"],
    },
    {
      expectedIds: ["step-1:segment:1", "step-1:segment:2"],
      expectedSolution: ["step-1:segment:2"],
      field: "segments",
      idField: "segmentIds",
      solution: { correct: [1] },
      type: "SELECT",
      values: ["하나", "둘"],
    },
    {
      expectedIds: ["step-1:item:1", "step-1:item:2"],
      expectedSolution: ["step-1:item:2", "step-1:item:1"],
      field: "items",
      idField: "itemIds",
      solution: { correct: ["둘", "하나"] },
      type: "ORDER",
      values: ["하나", "둘"],
    },
  ] as const)(
    "$type 항목과 정답을 stable ID로 결정적으로 정규화한다",
    ({
      expectedIds,
      expectedSolution,
      field,
      idField,
      solution,
      type,
      values,
    }) => {
      const first = normalizeVersionedStepContentOrThrow(
        "step-1",
        type,
        JSON.stringify({ [field]: values, ...solution })
      )
      const second = normalizeVersionedStepContentOrThrow("step-1", type, first)

      expect(second).toBe(first)
      expect(JSON.parse(first)).toMatchObject({
        [Object.keys(solution)[0] as string]: expectedSolution,
        [idField]: expectedIds,
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
