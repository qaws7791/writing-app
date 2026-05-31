import { describe, expect, it } from "vitest"

import { adminCourseEditorSaveRequestDtoSchema } from "./admin.dto"

const validSaveRequest = {
  courseId: "sentence-structure",
  expectedRevision: 0,
  course: {
    title: "문장 구조의 기본",
    description: "문장의 뼈대를 이해합니다.",
    sortOrder: 1,
  },
  chapters: [],
  lessons: [],
  steps: [
    {
      id: "intro-step",
      lessonId: "sentence-structure-01",
      type: "INTRO",
      title: "도입",
      sortOrder: 1,
      points: 0,
      required: true,
      status: "active",
      content: {
        title: "주어 찾기",
        category: "문장 구조",
        tagTone: "info",
        bullets: ["주어를 찾습니다."],
        estimatedMinutes: 8,
        totalSteps: 1,
      },
    },
  ],
}

describe("adminCourseEditorSaveRequestDtoSchema", () => {
  it("accepts step content that matches the step type contract", () => {
    expect(
      adminCourseEditorSaveRequestDtoSchema.parse(validSaveRequest)
    ).toEqual(validSaveRequest)
  })

  it("rejects step content that does not match the step type contract", () => {
    const result = adminCourseEditorSaveRequestDtoSchema.safeParse({
      ...validSaveRequest,
      steps: [
        {
          ...validSaveRequest.steps[0],
          content: {
            title: "주어 찾기",
          },
        },
      ],
    })

    expect(result.success).toBe(false)
  })
})
