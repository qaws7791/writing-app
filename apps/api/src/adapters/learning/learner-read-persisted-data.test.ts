import { describe, expect, it } from "vitest"

import { decodeLearnerLessonPersistedData } from "@/adapters/learning/learner-read-persisted-data"

describe("decodeLearnerLessonPersistedData", () => {
  it("row metadata를 authoritative 값으로 사용하고 query 순서를 보존한다", () => {
    const result = decodeLearnerLessonPersistedData({
      lessonId: "lesson-1",
      stepRows: [
        {
          contentJson: JSON.stringify({
            body: "두 번째 본문",
            guide: "두 번째 가이드",
            source: "출처",
            title: "두 번째 단계",
            type: "persisted-reading",
          }),
          id: "step-2",
          sortOrder: 2,
          type: "READING",
        },
        {
          contentJson: JSON.stringify({
            min: 1,
            prompt: "첫 번째 문장을 작성하세요.",
            type: "persisted-write",
          }),
          id: "step-1",
          sortOrder: 1,
          type: "WRITE",
        },
      ],
      summaryJson: JSON.stringify(["핵심 요약"]),
    })

    expect(result).toEqual({
      kind: "decoded",
      value: {
        steps: [
          {
            body: "두 번째 본문",
            guide: "두 번째 가이드",
            id: "step-2",
            sortOrder: 2,
            source: "출처",
            title: "두 번째 단계",
            type: "READING",
          },
          {
            id: "step-1",
            min: 1,
            prompt: "첫 번째 문장을 작성하세요.",
            sortOrder: 1,
            type: "WRITE",
          },
        ],
        summary: ["핵심 요약"],
      },
    })
  })

  it("빈 summary와 step row를 정상 결과로 decode한다", () => {
    expect(
      decodeLearnerLessonPersistedData({
        lessonId: "lesson-empty",
        stepRows: [],
        summaryJson: "[]",
      })
    ).toEqual({
      kind: "decoded",
      value: { steps: [], summary: [] },
    })
  })

  it.each([
    ["문법이 잘못된 JSON", "{", "invalid-json"],
    ["문자열 배열이 아닌 JSON", '{"summary":[]}', "schema-mismatch"],
    ["null JSON", "null", "schema-mismatch"],
  ] as const)("%s summary를 손상 결과로 반환한다", (_, summaryJson, reason) => {
    expect(
      decodeLearnerLessonPersistedData({
        lessonId: "lesson-corrupt-summary",
        stepRows: [],
        summaryJson,
      })
    ).toEqual({
      corruption: {
        field: "lesson-summary",
        lessonId: "lesson-corrupt-summary",
        reason,
      },
      kind: "corrupt",
    })
  })

  it.each([
    ["문법이 잘못된 JSON", "{", "invalid-json"],
    ["null JSON", "null", "schema-mismatch"],
    ["persisted type이 누락된 객체", '{"body":"본문"}', "schema-mismatch"],
    [
      "canonical step schema와 일치하지 않는 객체",
      '{"type":"reading","body":"본문"}',
      "schema-mismatch",
    ],
  ] as const)(
    "%s step content를 손상 결과로 반환한다",
    (_, contentJson, reason) => {
      expect(
        decodeLearnerLessonPersistedData({
          lessonId: "lesson-corrupt-step",
          stepRows: [
            {
              contentJson,
              id: "step-corrupt",
              sortOrder: 1,
              type: "READING",
            },
          ],
          summaryJson: "[]",
        })
      ).toEqual({
        corruption: {
          field: "lesson-step-content",
          lessonId: "lesson-corrupt-step",
          reason,
          stepId: "step-corrupt",
        },
        kind: "corrupt",
      })
    }
  )

  it("step row type이 canonical schema와 다르면 손상 결과로 반환한다", () => {
    expect(
      decodeLearnerLessonPersistedData({
        lessonId: "lesson-invalid-row-type",
        stepRows: [
          {
            contentJson: JSON.stringify({
              body: "본문",
              guide: "가이드",
              title: "제목",
              type: "reading",
            }),
            id: "step-invalid-type",
            sortOrder: 1,
            type: "reading",
          },
        ],
        summaryJson: "[]",
      })
    ).toEqual({
      corruption: {
        field: "lesson-step-content",
        lessonId: "lesson-invalid-row-type",
        reason: "schema-mismatch",
        stepId: "step-invalid-type",
      },
      kind: "corrupt",
    })
  })

  it("현재 평가 순서와 같이 step 손상을 summary 손상보다 먼저 반환한다", () => {
    expect(
      decodeLearnerLessonPersistedData({
        lessonId: "lesson-corrupt-both",
        stepRows: [
          {
            contentJson: "{",
            id: "step-corrupt-first",
            sortOrder: 1,
            type: "READING",
          },
        ],
        summaryJson: "{",
      })
    ).toEqual({
      corruption: {
        field: "lesson-step-content",
        lessonId: "lesson-corrupt-both",
        reason: "invalid-json",
        stepId: "step-corrupt-first",
      },
      kind: "corrupt",
    })
  })
})
