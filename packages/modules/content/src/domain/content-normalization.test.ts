import { describe, expect, it } from "vitest"

import {
  normalizeLegacyVersionedStepContentOrThrow,
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

  it("legacy READING에만 누락된 guide를 빈 문자열로 결정적으로 보완한다", () => {
    const legacyContent = JSON.stringify({
      body: "보관 본문",
      title: "보관 읽기",
      type: "reading",
    })
    const normalized = normalizeLegacyVersionedStepContentOrThrow(
      "archived-reading",
      "READING",
      legacyContent
    )

    expect(JSON.parse(normalized)).toEqual({
      body: "보관 본문",
      guide: "",
      title: "보관 읽기",
      type: "reading",
    })
    expect(
      normalizeLegacyVersionedStepContentOrThrow(
        "archived-reading",
        "READING",
        normalized
      )
    ).toBe(normalized)
    expect(
      normalizeLegacyVersionedStepContentOrThrow(
        "current-reading",
        "READING",
        JSON.stringify({
          body: "현재 본문",
          guide: "기존 안내",
          title: "현재 읽기",
        })
      )
    ).toBe(
      JSON.stringify({
        body: "현재 본문",
        guide: "기존 안내",
        title: "현재 읽기",
      })
    )
    expect(
      JSON.parse(
        normalizeVersionedStepContentOrThrow(
          "current-reading",
          "READING",
          legacyContent
        )
      )
    ).not.toHaveProperty("guide")
  })

  it.each([
    [
      "l25-s4",
      [
        { id: "l25-s1", sortOrder: 1, type: "READING" },
        { id: "l25-s2", sortOrder: 2, type: "COMPARE" },
        { id: "l25-s3", sortOrder: 3, type: "WRITE" },
        { id: "l25-s4", sortOrder: 4, type: "AI_FEEDBACK" },
      ],
      "l25-s3",
    ],
    [
      "l6-s4",
      [
        { id: "l6-s1", sortOrder: 1, type: "READING" },
        { id: "l6-s2", sortOrder: 2, type: "COMPARE" },
        { id: "l6-s3", sortOrder: 3, type: "WRITE" },
        { id: "l6-s4", sortOrder: 4, type: "AI_FEEDBACK" },
        { id: "l6-s5", sortOrder: 5, type: "WRITE" },
        { id: "l6-s6", sortOrder: 6, type: "WRITE" },
        { id: "l6-s7", sortOrder: 7, type: "WRITE" },
      ],
      "l6-s3",
    ],
  ] as const)(
    "legacy AI target wr를 %s의 가장 가까운 선행 WRITE ID로 바꾼다",
    (feedbackStepId, lessonSteps, expectedTarget) => {
      const normalized = normalizeLegacyVersionedStepContentOrThrow(
        feedbackStepId,
        "AI_FEEDBACK",
        JSON.stringify({ allowRetry: true, target: "wr" }),
        { lessonSteps }
      )

      expect(JSON.parse(normalized)).toMatchObject({ target: expectedTarget })
    }
  )

  it("legacy AI target을 결정할 선행 WRITE가 없거나 순서가 모호하면 실패한다", () => {
    expect(() =>
      normalizeLegacyVersionedStepContentOrThrow(
        "feedback",
        "AI_FEEDBACK",
        JSON.stringify({ target: "wr" }),
        {
          lessonSteps: [
            { id: "feedback", sortOrder: 1, type: "AI_FEEDBACK" },
            { id: "write-after", sortOrder: 2, type: "WRITE" },
          ],
        }
      )
    ).toThrow("no preceding WRITE")

    expect(() =>
      normalizeLegacyVersionedStepContentOrThrow(
        "feedback",
        "AI_FEEDBACK",
        JSON.stringify({ target: "wr" }),
        {
          lessonSteps: [
            { id: "write-1", sortOrder: 1, type: "WRITE" },
            { id: "write-2", sortOrder: 1, type: "WRITE" },
            { id: "feedback", sortOrder: 2, type: "AI_FEEDBACK" },
          ],
        }
      )
    ).toThrow("ambiguous")
  })
})
