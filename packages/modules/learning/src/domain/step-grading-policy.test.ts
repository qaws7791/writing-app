import { describe, expect, it } from "vitest"

import { lessonStepDtoSchema } from "@workspace/contracts/content/course"
import { learnerStepSubmissionSchema } from "@workspace/contracts/learning/step-data"

import { gradeLearnerStep } from "#learning/domain/step-grading-policy"

const orderStep = {
  correct: ["item-b", "item-a"],
  explanation: "순서 해설",
  id: "order-boundary",
  itemIds: ["item-a", "item-b"],
  items: ["첫째", "둘째"],
  sortOrder: 1,
  title: "순서",
  type: "ORDER",
} as const
const fillBlankStep = {
  answer: ["word-a", "word-b"],
  explanation: "어순 해설",
  id: "blank-boundary",
  sortOrder: 1,
  template: "___ ___",
  type: "FILL_BLANK",
  wordIds: ["word-a", "word-b"],
  words: ["나는", "쓴다"],
} as const
const selectStep = {
  correct: ["segment-a", "segment-b"],
  explanation: "선택 해설",
  id: "select-boundary",
  question: "고르기",
  segmentIds: ["segment-a", "segment-b"],
  segments: ["첫째", "둘째"],
  sortOrder: 1,
  type: "SELECT",
} as const

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

    expect(gradeLearnerStep(reading, { kind: "acknowledge" })).toEqual({
      answer: null,
      evaluation: null,
      kind: "accepted",
    })
  })

  it("AI 제공자 실패 fallback은 AI 코칭 단계만 건너뛴다", () => {
    const reading = lessonStepDtoSchema.parse({
      body: "본문",
      guide: "안내",
      id: "reading-1",
      sortOrder: 1,
      title: "읽기",
      type: "READING",
    })
    const aiFeedback = lessonStepDtoSchema.parse({
      allowRetry: true,
      feedback: "답변을 다듬어 보세요.",
      focus: "명료성",
      id: "ai-1",
      sortOrder: 2,
      target: "write-1",
      type: "AI_FEEDBACK",
    })

    expect(gradeLearnerStep(aiFeedback, { kind: "skip-ai-feedback" })).toEqual({
      answer: null,
      evaluation: null,
      kind: "accepted",
    })
    expect(gradeLearnerStep(reading, { kind: "skip-ai-feedback" })).toEqual({
      kind: "invalid",
    })
    expect(gradeLearnerStep(aiFeedback, { kind: "acknowledge" })).toEqual({
      kind: "invalid",
    })
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
        answer: ["word-a", "word-b"],
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
        correct: ["segment-b"],
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
        correct: ["item-b", "item-a"],
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
    const result = gradeLearnerStep(lessonStepDtoSchema.parse(step), {
      kind: "answer",
      submission: learnerStepSubmissionSchema.parse(answer),
    })

    expect(result).toMatchObject({
      kind: "accepted",
      evaluation: {
        correct: true,
        type: step.type,
      },
    })
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

    const retry = gradeLearnerStep(step, {
      kind: "answer",
      submission: learnerStepSubmissionSchema.parse({
        selectedOptionId: "option-a",
        type: "MULTIPLE_CHOICE",
      }),
    })
    const invalid = gradeLearnerStep(step, {
      kind: "answer",
      submission: learnerStepSubmissionSchema.parse({
        selectedOptionId: "unknown",
        type: "MULTIPLE_CHOICE",
      }),
    })

    expect(retry).toMatchObject({
      evaluation: { correct: false, type: "MULTIPLE_CHOICE" },
      kind: "retry",
    })
    expect(invalid).toEqual({ kind: "invalid" })
  })

  it.each([
    { case: "min 미달이면", expectedKind: "invalid", text: "네글자" },
    { case: "정확히 min이면", expectedKind: "accepted", text: "다섯글자야" },
    { case: "max를 넘기면", expectedKind: "invalid", text: "일곱글자입니다" },
  ] as const)(
    "WRITE 답안이 $case $expectedKind로 판정한다",
    ({ expectedKind, text }) => {
      const step = lessonStepDtoSchema.parse({
        id: "write-1",
        max: 6,
        min: 5,
        prompt: "문장을 쓰세요.",
        sortOrder: 1,
        type: "WRITE",
      })

      const result = gradeLearnerStep(step, {
        kind: "answer",
        submission: learnerStepSubmissionSchema.parse({ text, type: "WRITE" }),
      })

      expect(result.kind).toBe(expectedKind)
    }
  )

  it.each([
    {
      answer: { orderedItemIds: ["item-a"], type: "ORDER" },
      case: "ORDER 항목 수가 부족하면",
      step: orderStep,
    },
    {
      answer: { selectedChoiceIds: ["word-a"], type: "FILL_BLANK" },
      case: "FILL_BLANK 빈칸 수가 맞지 않으면",
      step: fillBlankStep,
    },
  ])("$case invalid로 거부한다", ({ answer, step }) => {
    expect(
      gradeLearnerStep(lessonStepDtoSchema.parse(step), {
        kind: "answer",
        submission: learnerStepSubmissionSchema.parse(answer),
      })
    ).toEqual({ kind: "invalid" })
  })

  it("SELECT 정답 일부만 고른 제출은 invalid가 아니라 오답 retry다", () => {
    expect(
      gradeLearnerStep(lessonStepDtoSchema.parse(selectStep), {
        kind: "answer",
        submission: learnerStepSubmissionSchema.parse({
          selectedItemIds: ["segment-a"],
          type: "SELECT",
        }),
      })
    ).toMatchObject({
      evaluation: { correct: false, type: "SELECT" },
      kind: "retry",
    })
  })

  it.each([
    {
      answer: {
        assignments: [
          { categoryId: "category-b", itemId: "item-a" },
          { categoryId: "category-a", itemId: "item-b" },
        ],
        type: "CATEGORIZE",
      },
      expectedCorrect: false,
      step: {
        categories: [
          { id: "category-a", label: "같음" },
          { id: "category-b", label: "같음" },
        ],
        explanation: "같은 표시 문자열도 ID로 구분합니다.",
        guide: "분류",
        id: "categorize-duplicate-text",
        items: [
          { categoryId: "category-a", id: "item-a", text: "같음" },
          { categoryId: "category-b", id: "item-b", text: "같음" },
        ],
        sortOrder: 1,
        title: "중복 표시 문자열 분류",
        type: "CATEGORIZE",
      },
    },
  ] as const)(
    "$step.type 중복 표시 문자열을 stable ID로 채점한다",
    ({ answer, expectedCorrect, step }) => {
      const result = gradeLearnerStep(lessonStepDtoSchema.parse(step), {
        kind: "answer",
        submission: learnerStepSubmissionSchema.parse(answer),
      })

      expect(result).toMatchObject({
        evaluation: { correct: expectedCorrect, type: step.type },
        kind: "retry",
      })
    }
  )
})
