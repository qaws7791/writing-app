import { describe, expect, it } from "vitest"

import { lessonStepDtoSchema } from "@workspace/contracts/content"
import { completeLearnerStepBodySchema } from "@workspace/contracts/learning"

import { gradeLearnerStep } from "#core/modules/learning/domain/step-grading-policy"

describe("학습 단계 서버 채점 정책", () => {
  it("수동 학습 단계만 답안 없이 acknowledge한다", () => {
    const reading = lessonStepDtoSchema.parse({
      body: "본문",
      guide: "안내",
      id: "reading-1",
      sortOrder: 1,
      title: "읽기",
      type: "READING",
    })

    expect(
      gradeLearnerStep(
        reading,
        completeLearnerStepBodySchema.parse({ kind: "acknowledge" })
      )
    ).toEqual({ answer: null, evaluation: null, kind: "accepted" })
  })

  it.each([
    {
      answer: { selectedOptionId: "option-b", type: "MULTIPLE_CHOICE" },
      step: {
        correct: "option-b",
        explanation: "둘째가 정답입니다.",
        id: "choice-1",
        options: [
          { id: "option-a", text: "첫째" },
          { id: "option-b", text: "둘째" },
        ],
        question: "질문",
        sortOrder: 1,
        type: "MULTIPLE_CHOICE",
      },
    },
    {
      answer: {
        selectedChoiceIds: ["word-a", "word-b"],
        type: "FILL_BLANK",
      },
      step: {
        answer: ["나는", "쓴다"],
        explanation: "어순 해설",
        id: "blank-1",
        sortOrder: 1,
        template: "___ ___",
        type: "FILL_BLANK",
        wordIds: ["word-a", "word-b"],
        words: ["나는", "쓴다"],
      },
    },
    {
      answer: { selectedItemIds: ["segment-b"], type: "SELECT" },
      step: {
        correct: [1],
        explanation: "선택 해설",
        id: "select-1",
        question: "고르기",
        segmentIds: ["segment-a", "segment-b"],
        segments: ["첫째", "둘째"],
        sortOrder: 1,
        type: "SELECT",
      },
    },
    {
      answer: { orderedItemIds: ["item-b", "item-a"], type: "ORDER" },
      step: {
        correct: ["둘째", "첫째"],
        explanation: "순서 해설",
        id: "order-1",
        itemIds: ["item-a", "item-b"],
        items: ["첫째", "둘째"],
        sortOrder: 1,
        title: "순서",
        type: "ORDER",
      },
    },
    {
      answer: {
        pairs: [{ leftItemId: "left-a", rightItemId: "right-a" }],
        type: "MATCH",
      },
      step: {
        explanation: "짝 해설",
        guide: "연결",
        id: "match-1",
        pairs: [
          {
            left: "왼쪽",
            leftId: "left-a",
            right: "오른쪽",
            rightId: "right-a",
          },
        ],
        sortOrder: 1,
        title: "짝",
        type: "MATCH",
      },
    },
    {
      answer: {
        assignments: [{ categoryId: "category-a", itemId: "item-a" }],
        type: "CATEGORIZE",
      },
      step: {
        categories: [{ id: "category-a", label: "분류" }],
        explanation: "분류 해설",
        guide: "분류",
        id: "categorize-1",
        items: [{ categoryId: "category-a", id: "item-a", text: "항목" }],
        sortOrder: 1,
        title: "분류",
        type: "CATEGORIZE",
      },
    },
  ])("$step.type 정답을 accepted로 판정한다", ({ answer, step }) => {
    const result = gradeLearnerStep(
      lessonStepDtoSchema.parse(step),
      completeLearnerStepBodySchema.parse({ answer, kind: "answer" })
    )

    expect(result.kind).toBe("accepted")
    if (result.kind === "accepted") {
      expect(result.evaluation).toMatchObject({
        correct: true,
        type: step.type,
      })
    }
  })

  it("유효한 오답은 evaluation을 포함한 retry이고 잘못된 ID는 invalid다", () => {
    const step = lessonStepDtoSchema.parse({
      correct: "option-b",
      explanation: "해설",
      id: "choice-1",
      options: [
        { id: "option-a", text: "첫째" },
        { id: "option-b", text: "둘째" },
      ],
      question: "질문",
      sortOrder: 1,
      type: "MULTIPLE_CHOICE",
    })

    const retry = gradeLearnerStep(
      step,
      completeLearnerStepBodySchema.parse({
        answer: { selectedOptionId: "option-a", type: "MULTIPLE_CHOICE" },
        kind: "answer",
      })
    )
    const invalid = gradeLearnerStep(
      step,
      completeLearnerStepBodySchema.parse({
        answer: { selectedOptionId: "unknown", type: "MULTIPLE_CHOICE" },
        kind: "answer",
      })
    )

    expect(retry).toMatchObject({
      evaluation: { correct: false, type: "MULTIPLE_CHOICE" },
      kind: "retry",
    })
    expect(invalid).toEqual({ kind: "invalid" })
  })
})
