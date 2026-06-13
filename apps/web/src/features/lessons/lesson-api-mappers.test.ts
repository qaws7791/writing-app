import { describe, expect, it } from "vitest"

import { mapLesson } from "@/features/lessons/lesson-api-mappers"

describe("레슨 API mapper", () => {
  it("API 레슨 응답의 Kwep step 타입 순서를 보존한다", () => {
    expect(
      mapLesson({
        category: "문장의 기본기",
        courseId: "c1",
        description: "명료한 문장을 살펴봅니다.",
        estimatedMinutes: 5,
        id: "l1",
        steps: [
          { id: "s1", sortOrder: 1, type: "READING" },
          { id: "s2", sortOrder: 2, type: "COMPARE" },
          { id: "s3", sortOrder: 3, type: "MULTIPLE_CHOICE" },
          { id: "s4", sortOrder: 4, type: "FILL_BLANK" },
          { id: "s5", sortOrder: 5, type: "SELECT" },
          { id: "s6", sortOrder: 6, type: "ORDER" },
          { id: "s7", sortOrder: 7, type: "WRITE" },
          { id: "s8", sortOrder: 8, type: "AI_FEEDBACK" },
          { id: "s9", sortOrder: 9, type: "MATCH" },
          { id: "s10", sortOrder: 10, type: "CATEGORIZE" },
        ],
        summary: ["좋은 문장은 모호하지 않다"],
        title: "좋은 문장이란 무엇인가",
        unitId: "u1",
      })
    ).toMatchObject({
      id: "l1",
      steps: [
        { id: "s1", order: 1, type: "READING" },
        { id: "s2", order: 2, type: "COMPARE" },
        { id: "s3", order: 3, type: "MULTIPLE_CHOICE" },
        { id: "s4", order: 4, type: "FILL_BLANK" },
        { id: "s5", order: 5, type: "SELECT" },
        { id: "s6", order: 6, type: "ORDER" },
        { id: "s7", order: 7, type: "WRITE" },
        { id: "s8", order: 8, type: "AI_FEEDBACK" },
        { id: "s9", order: 9, type: "MATCH" },
        { id: "s10", order: 10, type: "CATEGORIZE" },
      ],
    })
  })
})
