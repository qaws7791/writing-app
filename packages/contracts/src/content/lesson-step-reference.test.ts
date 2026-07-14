import { describe, expect, it } from "vitest"

import { lessonDtoSchema } from "@workspace/contracts/content"

describe("레슨 스텝 참조 계약", () => {
  it("AI 코칭이 같은 레슨의 앞선 WRITE 스텝을 참조하면 허용한다", () => {
    expect(lessonDtoSchema.safeParse(createLesson()).success).toBe(true)
  })

  it.each([
    ["없는 target", "missing", 2],
    ["WRITE가 아닌 target", "read-step", 2],
    ["AI 코칭보다 뒤의 target", "write-step", 1],
  ])("%s을 거절한다", (_name, target, aiSortOrder) => {
    const lesson = createLesson()
    const aiStep = lesson.steps[2]

    if (aiStep?.type !== "AI_FEEDBACK") {
      throw new Error("AI 코칭 테스트 fixture가 없습니다.")
    }

    expect(
      lessonDtoSchema.safeParse({
        ...lesson,
        steps: lesson.steps.map((step) =>
          step.id === aiStep.id
            ? { ...step, sortOrder: aiSortOrder, target }
            : step
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
        id: "ai-step",
        score: 80,
        scoreMax: 100,
        showScore: true,
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
