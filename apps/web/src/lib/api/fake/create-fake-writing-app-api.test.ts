import { describe, expect, it } from "vitest"

import { createFakeWritingAppApi } from "@/lib/api/fake/create-fake-writing-app-api"

describe("createFakeWritingAppApi", () => {
  it("serves course and lesson data without a backend", async () => {
    const api = createFakeWritingAppApi()

    const courses = await api.listCourseCategories()
    const lesson = await api.getLesson("sentence-structure-01" as never)

    expect(courses.status).toBe("ok")
    expect(lesson.status).toBe("ok")
  })

  it("stores lesson progress and answers in isolated memory", async () => {
    const api = createFakeWritingAppApi()

    await api.saveLessonProgress("sentence-structure-01" as never, {
      currentStepId: "sentence-structure-01-step-2" as never,
      stepOrder: 2,
    })
    await api.saveLessonAnswer("sentence-structure-01" as never, {
      stepId: "sentence-structure-01-step-2" as never,
      answer: "문장을 짧게 고쳤다.",
    })

    const progress = await api.getLessonProgress(
      "sentence-structure-01" as never
    )

    expect(progress).toMatchObject({
      status: "ok",
      value: {
        currentStepId: "sentence-structure-01-step-2",
        answers: [
          {
            stepId: "sentence-structure-01-step-2",
            answer: "문장을 짧게 고쳤다.",
          },
        ],
      },
    })
  })
})
