import { describe, expect, it } from "vitest"

import {
  getLessonStepActionLabel,
  getLessonStepCheckedResult,
  getLessonStepDescription,
  getLessonStepTitle,
  type CheckableLessonStep,
  isLessonStepCheckable,
  isLessonStepStandalone,
  isLessonStepSubmittable,
} from "@/features/lessons/lesson-step-policy"
import type { LessonStepAnswerPayload } from "@/features/lessons/lesson-logic"
import type { LessonStep } from "@/features/lessons/lesson-types"

describe("lesson-step-policy", () => {
  it("읽기 스텝의 제목, 설명, standalone layout, CTA 정책을 반환한다", () => {
    const step: LessonStep = {
      body: "본문",
      guide: "읽기 안내",
      id: "reading-1",
      order: 1,
      title: "읽기 제목",
      type: "READING",
    }

    expect(getLessonStepTitle(step)).toBe("읽기 제목")
    expect(getLessonStepDescription(step)).toBe("읽기 안내")
    expect(getLessonStepActionLabel(step)).toBe("이해했어요")
    expect(isLessonStepStandalone(step)).toBe(true)
    expect(isLessonStepCheckable(step)).toBe(false)
    expect(isLessonStepSubmittable(step, undefined)).toBe(true)
  })

  it("객관식 스텝의 제출 가능 여부와 정답 확인 결과를 반환한다", () => {
    const step: LessonStep = {
      correct: "b",
      explanation: "정답 해설",
      id: "mc-1",
      options: [
        { id: "a", text: "A" },
        { id: "b", text: "B" },
      ],
      order: 1,
      question: "정답은?",
      type: "MULTIPLE_CHOICE",
      wrong: "오답 안내",
    }
    const emptyPayload: LessonStepAnswerPayload = {
      selectedOptionId: "",
      type: "MULTIPLE_CHOICE",
    }
    const correctPayload: LessonStepAnswerPayload = {
      selectedOptionId: "b",
      type: "MULTIPLE_CHOICE",
    }

    expect(getLessonStepTitle(step)).toBe("정답은?")
    expect(getLessonStepDescription(step)).toBe(
      "답을 선택하면 해설을 확인합니다."
    )
    expect(getLessonStepActionLabel(step)).toBe("확인하기")
    expect(isLessonStepStandalone(step)).toBe(true)
    expect(isLessonStepCheckable(step)).toBe(true)
    expect(isLessonStepSubmittable(step, emptyPayload)).toBe(false)
    expect(isLessonStepSubmittable(step, correctPayload)).toBe(true)
    expect(getLessonStepCheckedResult(step, correctPayload)).toBe("correct")
  })

  it("분류 스텝은 모든 item이 분류되어야 제출 가능하다", () => {
    const step: LessonStep = {
      categories: [{ id: "topic", label: "주제문" }],
      explanation: "분류 해설",
      guide: "문장을 분류하세요.",
      id: "categorize-1",
      items: [
        {
          categoryId: "topic",
          id: "item-1",
          text: "꾸준한 글쓰기는 사고를 정돈한다.",
        },
      ],
      order: 1,
      title: "문장 분류",
      type: "CATEGORIZE",
    }

    expect(isLessonStepCheckable(step)).toBe(false)
    expect(isLessonStepSubmittable(step, undefined)).toBe(false)
    expect(
      isLessonStepSubmittable(step, {
        items: [{ categoryId: "topic", itemId: "item-1" }],
        type: "CATEGORIZE",
      })
    ).toBe(true)
  })

  it("채점 가능한 스텝은 타입별 정책으로 정오답을 판정한다", () => {
    const cases: readonly {
      readonly correctPayload: LessonStepAnswerPayload
      readonly expectedCorrect: ReturnType<typeof getLessonStepCheckedResult>
      readonly expectedWrong: ReturnType<typeof getLessonStepCheckedResult>
      readonly name: string
      readonly step: CheckableLessonStep
      readonly wrongPayload: LessonStepAnswerPayload
    }[] = [
      {
        correctPayload: {
          selectedWords: ["명확함", "간결함"],
          type: "FILL_BLANK",
        },
        expectedCorrect: "correct",
        expectedWrong: "wrong",
        name: "빈칸",
        step: {
          answer: ["명확함", "간결함"],
          explanation: "순서대로 채워야 합니다.",
          id: "blank-1",
          order: 1,
          template: "좋은 문장은 ___과 ___을 갖춘다.",
          type: "FILL_BLANK",
          words: ["명확함", "간결함"],
        },
        wrongPayload: {
          selectedWords: ["간결함", "명확함"],
          type: "FILL_BLANK",
        },
      },
      {
        correctPayload: {
          pairs: [
            { left: "그러나", right: "역접" },
            { left: "따라서", right: "결론" },
          ],
          type: "MATCH",
        },
        expectedCorrect: "correct",
        expectedWrong: "wrong",
        name: "매칭",
        step: {
          explanation: "짝이 맞아야 합니다.",
          guide: "맞는 기능을 고르세요.",
          id: "match-1",
          order: 1,
          pairs: [
            { left: "그러나", right: "역접" },
            { left: "따라서", right: "결론" },
          ],
          title: "접속사",
          type: "MATCH",
        },
        wrongPayload: {
          pairs: [
            { left: "그러나", right: "결론" },
            { left: "따라서", right: "역접" },
          ],
          type: "MATCH",
        },
      },
      {
        correctPayload: {
          selectedOptionId: "b",
          type: "MULTIPLE_CHOICE",
        },
        expectedCorrect: "correct",
        expectedWrong: "wrong",
        name: "객관식",
        step: {
          correct: "b",
          explanation: "B가 정답입니다.",
          id: "mc-2",
          options: [
            { id: "a", text: "A" },
            { id: "b", text: "B" },
          ],
          order: 1,
          question: "정답은?",
          type: "MULTIPLE_CHOICE",
        },
        wrongPayload: {
          selectedOptionId: "a",
          type: "MULTIPLE_CHOICE",
        },
      },
      {
        correctPayload: {
          orderedItems: ["원인", "결과"],
          type: "ORDER",
        },
        expectedCorrect: "correct",
        expectedWrong: "wrong",
        name: "순서",
        step: {
          correct: ["원인", "결과"],
          explanation: "원인이 먼저 옵니다.",
          id: "order-1",
          items: ["결과", "원인"],
          order: 1,
          title: "논리 순서",
          type: "ORDER",
        },
        wrongPayload: {
          orderedItems: ["결과", "원인"],
          type: "ORDER",
        },
      },
      {
        correctPayload: {
          selectedIndexes: [1, 3],
          type: "SELECT",
        },
        expectedCorrect: {
          explanation: "중복 표현을 고릅니다.",
          missed: [],
          wrong: [],
        },
        expectedWrong: {
          explanation: "중복 표현을 고릅니다.",
          missed: [3],
          wrong: [0],
        },
        name: "단어 선택",
        step: {
          correct: [1, 3],
          explanation: "중복 표현을 고릅니다.",
          id: "select-1",
          order: 1,
          question: "불필요한 표현은?",
          segments: ["나는", "정말 매우", "기쁘고", "아주"],
          type: "SELECT",
        },
        wrongPayload: {
          selectedIndexes: [0, 1],
          type: "SELECT",
        },
      },
    ]

    for (const testCase of cases) {
      expect(
        getLessonStepCheckedResult(testCase.step, testCase.correctPayload),
        `${testCase.name} 정답`
      ).toEqual(testCase.expectedCorrect)
      expect(
        getLessonStepCheckedResult(testCase.step, testCase.wrongPayload),
        `${testCase.name} 오답`
      ).toEqual(testCase.expectedWrong)
    }
  })

  it("채점 가능한 스텝은 잘못된 payload 타입을 오답으로 판정한다", () => {
    const wrongTypePayload: LessonStepAnswerPayload = {
      text: "채점 타입이 아닌 답변입니다.",
      type: "WRITE",
    }
    const steps: readonly CheckableLessonStep[] = [
      {
        answer: ["명확함"],
        explanation: "빈칸 해설",
        id: "blank-2",
        order: 1,
        template: "문장은 ___해야 합니다.",
        type: "FILL_BLANK",
        words: ["명확함"],
      },
      {
        explanation: "매칭 해설",
        guide: "짝을 맞추세요.",
        id: "match-2",
        order: 1,
        pairs: [{ left: "원인", right: "결과" }],
        title: "짝짓기",
        type: "MATCH",
      },
      {
        correct: "a",
        explanation: "객관식 해설",
        id: "mc-3",
        options: [{ id: "a", text: "A" }],
        order: 1,
        question: "정답은?",
        type: "MULTIPLE_CHOICE",
      },
      {
        correct: ["처음"],
        explanation: "순서 해설",
        id: "order-2",
        items: ["처음"],
        order: 1,
        title: "순서",
        type: "ORDER",
      },
      {
        correct: [0],
        explanation: "선택 해설",
        id: "select-2",
        order: 1,
        question: "고르세요.",
        segments: ["중복"],
        type: "SELECT",
      },
    ]

    for (const step of steps) {
      expect(getLessonStepCheckedResult(step, wrongTypePayload)).toBe("wrong")
    }
  })
})
