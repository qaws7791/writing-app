import { describe, expect, it } from "vitest"

import { lessonDtoSchema } from "#contracts/content/course"

const aiStepId = "ai-step"

describe("레슨 스텝 참조 계약", () => {
  it("AI 코칭이 같은 레슨의 앞선 WRITE 스텝을 참조하면 허용한다", () => {
    expect(() => lessonDtoSchema.parse(createLesson())).not.toThrow()
  })

  it.each([
    ["없는 target", "missing", 3, 2],
    ["WRITE가 아닌 target", "read-step", 3, 2],
    ["AI 코칭보다 뒤의 target", "write-step", 2, 3],
  ])("%s을 거절한다", (_name, target, aiSortOrder, writeSortOrder) => {
    const lesson = createLesson()

    expect(
      lessonDtoSchema.safeParse({
        ...lesson,
        steps: lesson.steps.map((step) =>
          step.id === aiStepId
            ? { ...step, sortOrder: aiSortOrder, target }
            : {
                ...step,
                sortOrder:
                  step.id === "write-step" ? writeSortOrder : step.sortOrder,
              }
        ),
      }).success
    ).toBe(false)
  })
})

function createLesson() {
  return {
    category: null,
    courseId: "course-1",
    description: null,
    estimatedMinutes: 5,
    id: "lesson-1",
    steps: [
      {
        body: "본문",
        guide: "읽기",
        id: "read-step",
        sortOrder: 1,
        title: "읽기",
        type: "READING" as const,
      },
      {
        id: "write-step",
        min: 20,
        prompt: "문장을 작성하세요.",
        sortOrder: 2,
        type: "WRITE" as const,
      },
      {
        allowRetry: true,
        feedback: "피드백",
        focus: "명확성",
        id: aiStepId,
        sortOrder: 3,
        target: "write-step",
        type: "AI_FEEDBACK" as const,
      },
    ],
    summary: [],
    title: "레슨",
    unitId: "unit-1",
  }
}
