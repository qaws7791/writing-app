import { describe, expect, it } from "vitest"

import { courseId, lessonId } from "./content.ids"
import { createContentService } from "./content.service"
import type { ContentRepository } from "./content.repository"

const repository: ContentRepository = {
  async listCourseCategories() {
    return {
      categories: [
        {
          id: "beginner",
          title: "입문자를 위한 코스",
          courses: [
            {
              id: "sentence-structure",
              title: "문장 구조의 기본",
              description: "문장의 뼈대를 이해합니다.",
              lessonCount: 12,
            },
          ],
        },
      ],
    }
  },
  async findCourseDetail(courseId) {
    if (courseId !== "sentence-structure") {
      return undefined
    }

    return {
      id: "sentence-structure",
      title: "문장 구조의 기본",
      description: "문장의 뼈대를 이해합니다.",
      lessonCount: 1,
      firstLessonId: "sentence-structure-01",
      chapters: [
        {
          id: "sentence-structure-chapter-1",
          title: "문장의 뼈대",
          lessons: [
            {
              id: "sentence-structure-01",
              lessonId: "sentence-structure-01",
              title: "주어와 서술어 찾기",
              description: "중심 성분을 구분합니다.",
              order: 1,
            },
          ],
        },
      ],
    }
  },
  async findLesson(lessonId) {
    if (lessonId !== "sentence-structure-01") {
      return undefined
    }

    return {
      id: "sentence-structure-01",
      title: "주어와 서술어 찾기",
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
            title: "주어와 서술어 찾기",
            category: "문장 구조",
            tagTone: "info",
            bullets: ["문장의 중심 성분을 구분합니다."],
            estimatedMinutes: 8,
            totalSteps: 2,
          },
        },
        {
          id: "sentence-structure-01-step-2",
          type: "COMPLETE",
          order: 2,
          points: 0,
          required: true,
          content: {
            nextAction: "next-lesson",
          },
        },
      ],
    }
  },
}

describe("createContentService", () => {
  it("returns course categories from the repository", async () => {
    const service = createContentService({ repository })

    const result = await service.listCourseCategories()

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.value.categories[0]?.id).toBe("beginner")
      expect(result.value.categories[0]?.courses[0]?.id).toBe(
        "sentence-structure"
      )
    }
  })

  it("returns an explicit course-not-found result", async () => {
    const service = createContentService({ repository })

    const result = await service.getCourseDetail(courseId("not-real"))

    expect(result).toEqual({
      status: "not-found",
      error: {
        code: "course-not-found",
        message: "코스를 찾을 수 없습니다.",
        courseId: "not-real",
      },
    })
  })

  it("returns an explicit lesson-not-found result", async () => {
    const service = createContentService({ repository })

    const result = await service.getLesson(lessonId("not-real"))

    expect(result).toEqual({
      status: "not-found",
      error: {
        code: "lesson-not-found",
        message: "레슨을 찾을 수 없습니다.",
        lessonId: "not-real",
      },
    })
  })

  it("rejects lesson steps with non-contiguous order", async () => {
    const service = createContentService({
      repository: {
        ...repository,
        async findLesson() {
          const result = await repository.findLesson(
            lessonId("sentence-structure-01")
          )
          if (!result) {
            return undefined
          }
          const firstStep = result.steps[0]
          if (!firstStep) {
            return undefined
          }

          return {
            ...result,
            steps: [{ ...firstStep, order: 2 }],
          }
        },
      },
    })

    const result = await service.getLesson(lessonId("sentence-structure-01"))

    expect(result).toEqual({
      status: "invalid-content",
      error: {
        code: "invalid-content-seed",
        message: "레슨 스텝 순서는 1부터 빈틈없이 이어져야 합니다.",
        lessonId: "sentence-structure-01",
      },
    })
  })

  it("accepts representative frontend lesson step types", async () => {
    const service = createContentService({
      repository: {
        ...repository,
        async findLesson() {
          const result = await repository.findLesson(
            lessonId("sentence-structure-01")
          )
          if (!result) {
            return undefined
          }
          const firstStep = result.steps[0]
          if (!firstStep) {
            return undefined
          }

          return {
            ...result,
            steps: [
              firstStep,
              {
                id: "sentence-structure-01-step-2",
                type: "CONCEPT",
                order: 2,
                points: 10,
                required: true,
                content: {
                  subtitle: "문장 성분의 기준",
                  body: "문장은 성분 사이의 관계로 읽습니다.",
                  highlight: {
                    icon: "!",
                    text: "주어와 서술어가 맞물리는지 확인합니다.",
                    tone: "info",
                  },
                  keyTerms: [
                    {
                      term: "주어",
                      definition: "문장에서 동작이나 상태의 주체입니다.",
                    },
                  ],
                },
              },
              {
                id: "sentence-structure-01-step-3",
                type: "MULTIPLE_CHOICE",
                order: 3,
                points: 10,
                required: true,
                content: {
                  context: "주어와 서술어 찾기",
                  question: "문장 구조를 확인하는 기준은 무엇인가요?",
                  options: [
                    {
                      id: "A",
                      text: "주어와 서술어의 호응을 확인한다.",
                      isCorrect: true,
                    },
                    {
                      id: "B",
                      text: "문장을 무조건 길게 쓴다.",
                      isCorrect: false,
                    },
                  ],
                  explanation: "주어와 서술어의 관계가 문장의 뼈대입니다.",
                  allowMultiple: false,
                  shuffleOptions: false,
                },
              },
              {
                id: "sentence-structure-01-step-4",
                type: "COMPLETE",
                order: 4,
                points: 0,
                required: true,
                content: {
                  nextAction: "next-lesson",
                },
              },
            ],
          }
        },
      },
    })

    const result = await service.getLesson(lessonId("sentence-structure-01"))

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.value.steps.map((step) => step.type)).toEqual([
        "INTRO",
        "CONCEPT",
        "MULTIPLE_CHOICE",
        "COMPLETE",
      ])
    }
  })

  it("returns invalid-content when course category DTOs are invalid", async () => {
    const service = createContentService({
      repository: {
        ...repository,
        async listCourseCategories() {
          return JSON.parse(
            JSON.stringify({
              categories: [{ id: "", title: "", courses: [] }],
            })
          )
        },
      },
    })

    const result = await service.listCourseCategories()

    expect(result).toEqual({
      status: "invalid-content",
      error: {
        code: "invalid-content-seed",
        message: "콘텐츠 시드가 올바르지 않습니다.",
      },
    })
  })

  it("returns invalid-content when course detail DTOs are invalid", async () => {
    const service = createContentService({
      repository: {
        ...repository,
        async findCourseDetail() {
          return JSON.parse(
            JSON.stringify({
              id: "",
              title: "",
              description: "",
              lessonCount: -1,
              chapters: [],
            })
          )
        },
      },
    })

    const result = await service.getCourseDetail(courseId("sentence-structure"))

    expect(result).toEqual({
      status: "invalid-content",
      error: {
        code: "invalid-content-seed",
        message: "콘텐츠 시드가 올바르지 않습니다.",
      },
    })
  })

  it("returns invalid-content when lesson DTOs are invalid", async () => {
    const service = createContentService({
      repository: {
        ...repository,
        async findLesson() {
          return JSON.parse(
            JSON.stringify({
              id: "",
              title: "",
              categoryId: "",
              courseId: "",
              unitNumber: 0,
              steps: [],
            })
          )
        },
      },
    })

    const result = await service.getLesson(lessonId("sentence-structure-01"))

    expect(result).toEqual({
      status: "invalid-content",
      error: {
        code: "invalid-content-seed",
        message: "콘텐츠 시드가 올바르지 않습니다.",
        lessonId: "sentence-structure-01",
      },
    })
  })

  it("returns invalid-content when a lesson has no steps", async () => {
    const service = createContentService({
      repository: {
        ...repository,
        async findLesson() {
          const result = await repository.findLesson(
            lessonId("sentence-structure-01")
          )

          return result ? { ...result, steps: [] } : undefined
        },
      },
    })

    const result = await service.getLesson(lessonId("sentence-structure-01"))

    expect(result).toEqual({
      status: "invalid-content",
      error: {
        code: "invalid-content-seed",
        message: "레슨에는 하나 이상의 스텝이 필요합니다.",
        lessonId: "sentence-structure-01",
      },
    })
  })

  it("returns invalid-content when a playable lesson does not start with intro", async () => {
    const service = createContentService({
      repository: {
        ...repository,
        async findLesson() {
          const result = await repository.findLesson(
            lessonId("sentence-structure-01")
          )
          if (!result) {
            return undefined
          }

          return {
            ...result,
            steps: result.steps.map((step, index) =>
              index === 0
                ? {
                    id: "summary-step",
                    type: "SUMMARY" as const,
                    order: 1,
                    points: 0,
                    required: true,
                    content: {
                      points: [{ number: 1, text: "정리합니다." }],
                    },
                  }
                : step
            ),
          }
        },
      },
    })

    const result = await service.getLesson(lessonId("sentence-structure-01"))

    expect(result).toEqual({
      status: "invalid-content",
      error: {
        code: "invalid-content-seed",
        message: "레슨은 INTRO 스텝으로 시작해야 합니다.",
        lessonId: "sentence-structure-01",
      },
    })
  })

  it("returns invalid-content when a playable lesson does not end with complete", async () => {
    const service = createContentService({
      repository: {
        ...repository,
        async findLesson() {
          const result = await repository.findLesson(
            lessonId("sentence-structure-01")
          )

          return result
            ? { ...result, steps: result.steps.slice(0, 1) }
            : undefined
        },
      },
    })

    const result = await service.getLesson(lessonId("sentence-structure-01"))

    expect(result).toEqual({
      status: "invalid-content",
      error: {
        code: "invalid-content-seed",
        message: "레슨은 COMPLETE 스텝으로 끝나야 합니다.",
        lessonId: "sentence-structure-01",
      },
    })
  })

  it("returns invalid-content when an AI feedback source step is missing", async () => {
    const service = createContentService({
      repository: {
        ...repository,
        async findLesson() {
          const result = await repository.findLesson(
            lessonId("sentence-structure-01")
          )
          if (!result) {
            return undefined
          }
          const introStep = result.steps[0]
          const completeStep = result.steps[1]
          if (!introStep || !completeStep) {
            return undefined
          }

          return {
            ...result,
            steps: [
              introStep,
              {
                id: "feedback-step",
                type: "AI_FEEDBACK" as const,
                order: 2,
                points: 0,
                required: true,
                content: {
                  sourceStepId: "missing-step",
                  feedbackPrompt: "명확성을 평가합니다.",
                  focusAreas: ["clarity" as const],
                  showScore: true,
                  scoreRange: [0, 100] as const,
                  allowRevision: true,
                  maxRevisions: 1,
                },
              },
              { ...completeStep, order: 3 },
            ],
          }
        },
      },
    })

    const result = await service.getLesson(lessonId("sentence-structure-01"))

    expect(result).toEqual({
      status: "invalid-content",
      error: {
        code: "invalid-content-seed",
        message: "AI 피드백 스텝이 참조하는 원본 스텝을 찾을 수 없습니다.",
        lessonId: "sentence-structure-01",
      },
    })
  })

  it("returns invalid-content when lesson step content is not valid JSON content", async () => {
    const service = createContentService({
      repository: {
        ...repository,
        async findLesson() {
          const result = await repository.findLesson(
            lessonId("sentence-structure-01")
          )
          if (!result) {
            return undefined
          }
          const firstStep = result.steps[0]
          if (!firstStep) {
            return undefined
          }

          return {
            ...result,
            steps: [{ ...firstStep, content: null }],
          }
        },
      },
    })

    const result = await service.getLesson(lessonId("sentence-structure-01"))

    expect(result).toEqual({
      status: "invalid-content",
      error: {
        code: "invalid-content-seed",
        message: "콘텐츠 시드가 올바르지 않습니다.",
        lessonId: "sentence-structure-01",
      },
    })
  })

  it("returns unavailable when listing categories fails", async () => {
    const service = createContentService({
      repository: {
        ...repository,
        async listCourseCategories() {
          throw new Error("database unavailable")
        },
      },
    })

    const result = await service.listCourseCategories()

    expect(result).toEqual({
      status: "unavailable",
      error: {
        code: "database-unavailable",
        message: "데이터베이스를 사용할 수 없습니다.",
      },
    })
  })

  it("returns unavailable when finding a course fails", async () => {
    const service = createContentService({
      repository: {
        ...repository,
        async findCourseDetail() {
          throw new Error("database unavailable")
        },
      },
    })

    const result = await service.getCourseDetail(courseId("sentence-structure"))

    expect(result).toEqual({
      status: "unavailable",
      error: {
        code: "database-unavailable",
        message: "데이터베이스를 사용할 수 없습니다.",
      },
    })
  })

  it("returns unavailable when finding a lesson fails", async () => {
    const service = createContentService({
      repository: {
        ...repository,
        async findLesson() {
          throw new Error("database unavailable")
        },
      },
    })

    const result = await service.getLesson(lessonId("sentence-structure-01"))

    expect(result).toEqual({
      status: "unavailable",
      error: {
        code: "database-unavailable",
        message: "데이터베이스를 사용할 수 없습니다.",
      },
    })
  })
})
