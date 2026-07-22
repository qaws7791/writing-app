import { describe, expect, it } from "vitest"

import {
  normalizeVersionedStepContent,
  normalizeVersionedStepContentOrThrow,
} from "#content/domain/content-normalization"

describe("content normalization policy", () => {
  it.each([
    ["FILL_BLANK", "words", "wordIds", ["하나", "둘"]],
    ["SELECT", "segments", "segmentIds", ["하나", "둘"]],
    ["ORDER", "items", "itemIds", ["하나", "둘"]],
  ] as const)(
    "%s 항목 ID를 결정적으로 정규화한다",
    (type, field, idField, values) => {
      const first = normalizeVersionedStepContentOrThrow(
        "step-1",
        type,
        JSON.stringify({ [field]: values })
      )
      const second = normalizeVersionedStepContentOrThrow("step-1", type, first)

      expect(second).toBe(first)
      expect(JSON.parse(first)).toMatchObject({
        [idField]: [
          "step-1:" + idField.replace("Ids", "") + ":1",
          "step-1:" + idField.replace("Ids", "") + ":2",
        ],
      })
    }
  )

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
