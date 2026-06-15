import { describe, expect, it } from "vitest"

import { isValidLessonStepAnswerPayload } from "@/features/lessons/lesson-logic"
import type { LessonStep } from "@/features/lessons/lesson-types"

describe("레슨 답변 payload 검증", () => {
  it("선택형 답변은 현재 segment 범위 안의 중복 없는 index만 허용한다", () => {
    const step: LessonStep = {
      correct: [0],
      explanation: "첫 구간입니다.",
      id: "select-1",
      order: 1,
      question: "주어를 고르세요.",
      segments: ["꾸준한", "글쓰기"],
      type: "SELECT",
    }

    expect(
      isValidLessonStepAnswerPayload(step, {
        selectedIndexes: [0],
        type: "SELECT",
      })
    ).toBe(true)
    expect(
      isValidLessonStepAnswerPayload(step, {
        selectedIndexes: [0, 0],
        type: "SELECT",
      })
    ).toBe(false)
    expect(
      isValidLessonStepAnswerPayload(step, {
        selectedIndexes: [2],
        type: "SELECT",
      })
    ).toBe(false)
  })

  it("순서 배열 답변은 현재 item을 중복 없이 모두 포함해야 한다", () => {
    const step: LessonStep = {
      correct: ["나는", "읽었다"],
      explanation: "기본 어순입니다.",
      id: "order-1",
      items: ["나는", "읽었다"],
      order: 1,
      title: "문장 배열",
      type: "ORDER",
    }

    expect(
      isValidLessonStepAnswerPayload(step, {
        orderedItems: ["나는", "읽었다"],
        type: "ORDER",
      })
    ).toBe(true)
    expect(
      isValidLessonStepAnswerPayload(step, {
        orderedItems: ["나는", "나는"],
        type: "ORDER",
      })
    ).toBe(false)
  })

  it("분류 답변은 현재 item과 category id만 허용한다", () => {
    const step: LessonStep = {
      categories: [{ id: "topic", label: "주제문" }],
      explanation: "문장 역할입니다.",
      guide: "분류하세요.",
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

    expect(
      isValidLessonStepAnswerPayload(step, {
        items: [{ categoryId: "topic", itemId: "item-1" }],
        type: "CATEGORIZE",
      })
    ).toBe(true)
    expect(
      isValidLessonStepAnswerPayload(step, {
        items: [{ categoryId: "missing", itemId: "item-1" }],
        type: "CATEGORIZE",
      })
    ).toBe(false)
  })
})
