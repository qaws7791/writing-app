import { describe, expect, it } from "vitest"

import { mapLessonDto } from "@/features/lessons/lesson-api-mappers"

describe("lesson-api-mappers", () => {
  it("maps playable API lesson DTOs", () => {
    const lesson = mapLessonDto({
      id: "sentence-structure-01",
      title: "주어 찾기",
      categoryId: "beginner",
      courseId: "sentence-structure",
      unitNumber: 1,
      nextLessonId: "sentence-structure-02",
      steps: [
        {
          id: "sentence-structure-01-step-1",
          type: "INTRO",
          order: 1,
          points: 10,
          required: true,
          content: {
            title: "주어 찾기",
            category: "문장 구조",
            tagTone: "info",
            bullets: ["주어를 찾습니다."],
            estimatedMinutes: 8,
            totalSteps: 1,
            xpAvailable: 10,
          },
        },
      ],
    })

    expect(lesson.id).toBe("sentence-structure-01")
    expect(lesson.steps[0]?.type).toBe("INTRO")
  })
})
