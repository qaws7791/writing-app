import { describe, expect, it } from "vitest"

import { courseId, lessonId } from "@/content/content.ids"
import { createContentService } from "@/content/content.service"
import type { ContentRepository } from "@/content/content.repository"

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
              thumbnail: "/course-thumbnails/sentence-structure.png",
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
      thumbnail: "/course-thumbnails/sentence-structure.png",
      lessonCount: 1,
      firstLessonId: "sentence-structure-01",
      chapters: [
        {
          id: "sentence-structure-chapter-1",
          label: "1단원",
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
            totalSteps: 1,
            xpAvailable: 10,
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
        message: "Course was not found.",
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
        message: "Lesson was not found.",
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
        message: "Lesson steps must use contiguous order starting at 1.",
        lessonId: "sentence-structure-01",
      },
    })
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
        message: "Content seed is invalid.",
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
              thumbnail: "",
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
        message: "Content seed is invalid.",
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
        message: "Content seed is invalid.",
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
        message: "Database is unavailable.",
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
        message: "Database is unavailable.",
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
        message: "Database is unavailable.",
      },
    })
  })
})
