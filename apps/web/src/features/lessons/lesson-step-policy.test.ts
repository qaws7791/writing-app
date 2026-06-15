import { describe, expect, it } from "vitest"

import {
  getLessonStepActionLabel,
  getLessonStepCheckedResult,
  getLessonStepDescription,
  getLessonStepTitle,
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
})
