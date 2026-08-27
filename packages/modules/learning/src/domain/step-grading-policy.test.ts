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

const trueFalseStep = {
  correct: false,
  explanation: "근거는 주장을 반복하지 않습니다.",
  id: "true-false-stable-id",
  question: "참인지 거짓인지 판단하세요.",
  sortOrder: 1,
  statement: "근거는 주장을 반복하는 문장으로 충분하다.",
  type: "TRUE_FALSE",
} as const

const sentenceBuildStep = {
  correct: ["tile-a", "tile-c"],
  explanation: "방해 타일을 빼고 두 어절만 씁니다.",
  id: "sentence-build-stable-id",
  question: "어절을 모아 문장을 만드세요.",
  sortOrder: 1,
  tileIds: ["tile-a", "tile-b", "tile-c"],
  tiles: ["나는", "아주", "쓴다"],
  type: "SENTENCE_BUILD",
} as const

const errorCorrectStep = {
  correctFix: "fix-b",
  correctSegment: "segment-b",
  explanation: "구간과 교정안을 모두 맞혀야 정답입니다.",
  fixIds: ["fix-a", "fix-b"],
  fixes: ["주장을 되풀이하며", "사실과 사례를 들며"],
  id: "error-correct-stable-id",
  question: "오류 구간을 찾아 고치세요.",
  segmentIds: ["segment-a", "segment-b", "segment-c"],
  segments: ["근거는", "주장을 되풀이하며", "독자를 설득한다."],
  sortOrder: 1,
  type: "ERROR_CORRECT",
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
    {
      answer: { selectedAnswer: false, type: "TRUE_FALSE" },
      expectedKind: "accepted",
      name: "TRUE_FALSE 정답 판정",
      step: trueFalseStep,
    },
    {
      answer: { selectedAnswer: true, type: "TRUE_FALSE" },
      expectedKind: "retry",
      name: "TRUE_FALSE 반대로 판정한 오답",
      step: trueFalseStep,
    },
    {
      answer: { selectedTileIds: ["tile-a", "tile-c"], type: "SENTENCE_BUILD" },
      expectedKind: "accepted",
      name: "SENTENCE_BUILD 방해 타일을 제외한 정답 순서",
      step: sentenceBuildStep,
    },
    {
      answer: { selectedTileIds: ["tile-c", "tile-a"], type: "SENTENCE_BUILD" },
      expectedKind: "retry",
      name: "SENTENCE_BUILD 타일은 맞지만 순서가 어긋난 오답",
      step: sentenceBuildStep,
    },
    {
      answer: { selectedTileIds: ["tile-a", "tile-b"], type: "SENTENCE_BUILD" },
      expectedKind: "retry",
      name: "SENTENCE_BUILD 방해 타일을 넣은 오답",
      step: sentenceBuildStep,
    },
    {
      answer: {
        selectedFixId: "fix-a",
        selectedSegmentId: "segment-b",
        type: "ERROR_CORRECT",
      },
      expectedKind: "retry",
      name: "ERROR_CORRECT 구간은 맞고 교정안이 틀린 오답",
      step: errorCorrectStep,
    },
    {
      answer: {
        selectedFixId: "fix-b",
        selectedSegmentId: "segment-b",
        type: "ERROR_CORRECT",
      },
      expectedKind: "accepted",
      name: "ERROR_CORRECT 구간과 교정안을 모두 맞힌 정답",
      step: errorCorrectStep,
    },
    {
      answer: {
        selectedFixId: "unknown",
        selectedSegmentId: "segment-b",
        type: "ERROR_CORRECT",
      },
      expectedKind: "invalid",
      name: "ERROR_CORRECT 존재하지 않는 교정안 ID",
      step: errorCorrectStep,
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

  it("오답 제출에 acceptIncorrect가 있으면 accepted로 판정한다", () => {
    const result = gradeLearnerStep(
      lessonStepDtoSchema.parse(multipleChoiceStep),
      {
        acceptIncorrect: true,
        kind: "answer",
        submission: learnerStepSubmissionSchema.parse({
          selectedOptionId: "option-a",
          type: "MULTIPLE_CHOICE",
        }),
      }
    )

    expect(result.kind).toBe("accepted")
    if (result.kind === "accepted") {
      expect(result.evaluation?.correct).toBe(false)
    }
  })
})
