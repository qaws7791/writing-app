import { describe, expect, it } from "vitest"

import { adminCourseEditorSchema } from "@/features/course-editor/model/admin-course-editor"

describe("adminCourseEditorSchema", () => {
  it("generated DTO 경계에서 명시적인 undefined 속성을 제거한다", () => {
    const document = adminCourseEditorSchema.parse({
      assets: [],
      category: "미분류",
      coverAssetId: null,
      curriculumVersionId: "course-1-v2",
      description: "설명",
      editVersion: 1,
      id: "course-1",
      revision: 2,
      status: "active",
      title: "코스",
      units: [
        {
          id: "unit-1",
          lessons: [
            {
              category: null,
              description: null,
              estimatedMinutes: 10,
              id: "lesson-1",
              sortOrder: 1,
              status: "active",
              summary: [],
              steps: [
                {
                  correct: "option-1",
                  explanation: "해설",
                  id: "step-1",
                  options: [
                    { id: "option-1", text: "첫 번째" },
                    { id: "option-2", text: "두 번째" },
                  ],
                  question: "질문",
                  sortOrder: 1,
                  status: "active",
                  type: "MULTIPLE_CHOICE",
                  wrong: undefined,
                },
              ],
              title: "강의",
            },
          ],
          sortOrder: 1,
          status: "active",
          title: "단원",
        },
      ],
    })

    expect(document.units[0]?.lessons[0]?.steps[0]).not.toHaveProperty("wrong")
  })
})
