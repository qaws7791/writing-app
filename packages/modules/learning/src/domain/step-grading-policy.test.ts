import { describe, expect, it } from "vitest"

import { lessonStepDtoSchema } from "@workspace/contracts/content/course"
import { learnerStepSubmissionSchema } from "@workspace/contracts/learning/step-data"

import { gradeLearnerStep } from "#learning/domain/step-grading-policy"

const multipleChoiceStep = {
  correct: "option-b",
  explanation: "둘째가 정답입니다.",
  id: "choice-stable-id",
  options: [
    { id: "option-a", text: "첫째" },
    { id: "option-b", text: "둘째" },
  ],
  question: "정답은?",
  sortOrder: 1,
  type: "MULTIPLE_CHOICE",
} as const

const selectStep = {
  correct: ["segment-a", "segment-b"],
  explanation: "두 항목을 모두 고릅니다.",
  id: "select-partial",
  question: "정답을 모두 고르세요.",
  segmentIds: ["segment-a", "segment-b", "segment-c"],
  segments: ["첫째", "둘째", "셋째"],
  sortOrder: 1,
  type: "SELECT",
} as const

const matchWithDuplicateLabelsStep = {
  explanation: "표시 문자열이 같아도 ID로 짝을 구분합니다.",
  guide: "짝을 연결하세요.",
  id: "match-duplicate-labels",
  pairs: [
    {
      left: "같은 표시",
      leftId: "left-a",
      right: "오른쪽",
      rightId: "right-a",
    },
    {
      left: "왼쪽",
      leftId: "left-b",
      right: "같은 표시",
      rightId: "right-b",
    },
  ],
  sortOrder: 1,
  title: "짝",
  type: "MATCH",
} as const

const orderStep = {
  correct: ["item-b", "item-a"],
  explanation: "ID 순서가 정답을 결정합니다.",
  id: "order-stable-id",
  itemIds: ["item-a", "item-b"],
  items: ["첫째", "둘째"],
  sortOrder: 1,
  title: "순서",
  type: "ORDER",
} as const

describe("학습 단계 서버 채점 정책", () => {
  it.each([
    {
      answer: { selectedOptionId: "option-b", type: "MULTIPLE_CHOICE" },
      expectedKind: "accepted",
      name: "MULTIPLE_CHOICE 정답 stable ID",
      step: multipleChoiceStep,
    },
    {
      answer: { selectedOptionId: "option-a", type: "MULTIPLE_CHOICE" },
      expectedKind: "retry",
      name: "MULTIPLE_CHOICE 유효한 오답 stable ID",
      step: multipleChoiceStep,
    },
    {
      answer: { selectedOptionId: "unknown", type: "MULTIPLE_CHOICE" },
      expectedKind: "invalid",
      name: "MULTIPLE_CHOICE 존재하지 않는 ID",
      step: multipleChoiceStep,
    },
    {
      answer: { selectedItemIds: ["segment-a"], type: "SELECT" },
      expectedKind: "retry",
      name: "SELECT 정답 일부만 고른 유효한 오답",
      step: selectStep,
    },
    {
      answer: {
        pairs: [
          { leftItemId: "left-a", rightItemId: "right-b" },
          { leftItemId: "left-b", rightItemId: "right-a" },
        ],
        type: "MATCH",
      },
      expectedKind: "retry",
      name: "MATCH 중복 label의 잘못된 stable ID 짝",
      step: matchWithDuplicateLabelsStep,
    },
    {
      answer: { orderedItemIds: ["item-a", "item-b"], type: "ORDER" },
      expectedKind: "retry",
      name: "ORDER 유효하지만 잘못된 ID 순서",
      step: orderStep,
    },
  ] as const)(
    "$name 제출을 $expectedKind로 판정한다",
    ({ answer, expectedKind, step }) => {
      const result = gradeLearnerStep(lessonStepDtoSchema.parse(step), {
        kind: "answer",
        submission: learnerStepSubmissionSchema.parse(answer),
      })

      expect(result.kind).toBe(expectedKind)
    }
  )
})
