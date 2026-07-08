import { describe, expect, it } from "vitest"

import type { LessonStepAnswerPayload } from "@/features/step-debug/step-logic"
import {
  getLessonStepActionLabel,
  getLessonStepCheckedResult,
  isLessonStepCheckable,
  isLessonStepSubmittable,
} from "@/features/step-debug/step-policy"
import type { LessonStep } from "@/features/step-debug/step-types"

describe("step-policy", () => {
  const matchStep: LessonStep = {
    explanation: "접속사는 문장 사이의 논리 관계를 신호로 보여줍니다.",
    guide: "왼쪽 접속사와 오른쪽 기능을 짝지어 보세요.",
    id: "debug-match-1",
    order: 1,
    pairs: [
      { left: "그러나", right: "역접" },
      { left: "따라서", right: "인과" },
    ],
    title: "접속사와 기능 짝짓기",
    type: "MATCH",
  }

  it("MATCH 스텝은 채점 가능하고 확인하기 CTA를 사용한다", () => {
    expect(isLessonStepCheckable(matchStep)).toBe(true)
    expect(getLessonStepActionLabel(matchStep)).toBe("확인하기")
  })

  it("MATCH 스텝은 모든 짝이 채워져야 제출 가능하다", () => {
    expect(isLessonStepSubmittable(matchStep, undefined)).toBe(false)
    expect(
      isLessonStepSubmittable(matchStep, {
        pairs: [{ left: "그러나", right: "역접" }],
        type: "MATCH",
      })
    ).toBe(false)
    expect(
      isLessonStepSubmittable(matchStep, {
        pairs: [
          { left: "그러나", right: "역접" },
          { left: "따라서", right: "인과" },
        ],
        type: "MATCH",
      })
    ).toBe(true)
  })

  it("MATCH 스텝은 짝 정답 여부를 판정한다", () => {
    const correctPayload: LessonStepAnswerPayload = {
      pairs: [
        { left: "그러나", right: "역접" },
        { left: "따라서", right: "인과" },
      ],
      type: "MATCH",
    }
    const wrongPayload: LessonStepAnswerPayload = {
      pairs: [
        { left: "그러나", right: "인과" },
        { left: "따라서", right: "역접" },
      ],
      type: "MATCH",
    }

    expect(getLessonStepCheckedResult(matchStep, correctPayload)).toBe(
      "correct"
    )
    expect(getLessonStepCheckedResult(matchStep, wrongPayload)).toBe("wrong")
  })

  it("CATEGORIZE 스텝은 채점 가능하고 확인하기 CTA를 사용한다", () => {
    const categorizeStep: LessonStep = {
      categories: [
        { id: "A", label: "주제문" },
        { id: "B", label: "뒷받침" },
      ],
      explanation: "단락은 주제문과 뒷받침으로 구성합니다.",
      guide: "각 문장의 역할을 분류하세요.",
      id: "debug-categorize-1",
      items: [
        { categoryId: "A", id: "i1", text: "꾸준한 글쓰기는 사고를 정돈한다." },
        {
          categoryId: "B",
          id: "i2",
          text: "매일 쓰는 사람은 생각을 명확히 한다.",
        },
      ],
      order: 1,
      title: "문장 분류하기",
      type: "CATEGORIZE",
    }

    expect(isLessonStepCheckable(categorizeStep)).toBe(true)
    expect(getLessonStepActionLabel(categorizeStep)).toBe("확인하기")
    expect(
      getLessonStepCheckedResult(categorizeStep, {
        items: [
          { categoryId: "A", itemId: "i1" },
          { categoryId: "B", itemId: "i2" },
        ],
        type: "CATEGORIZE",
      })
    ).toBe("correct")
    expect(
      getLessonStepCheckedResult(categorizeStep, {
        items: [
          { categoryId: "B", itemId: "i1" },
          { categoryId: "A", itemId: "i2" },
        ],
        type: "CATEGORIZE",
      })
    ).toBe("wrong")
  })
})
