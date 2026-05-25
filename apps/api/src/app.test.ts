import { describe, expect, it } from "vitest"

import type { ContentService } from "@workspace/core/content"

import { createApiApp } from "@/app"

const courseCategories = {
  categories: [
    {
      id: "beginner",
      title: "입문자를 위한 코스",
      courses: [
        {
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "문장의 뼈대를 이해합니다.",
          lessonCount: 1,
          thumbnail: "/course-thumbnails/sentence-structure.png",
        },
      ],
    },
  ],
}

const courseDetail = {
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

const lesson = {
  id: "sentence-structure-01",
  title: "주어와 서술어 찾기",
  categoryId: "beginner",
  courseId: "sentence-structure",
  unitNumber: 1,
  nextLessonId: "sentence-structure-02",
  steps: [
    {
      id: "sentence-structure-01-step-1",
      type: "INTRO" as const,
      order: 1,
      points: 10,
      required: true,
      content: {
        title: "주어와 서술어 찾기",
        category: "문장 구조",
        tagTone: "info" as const,
        bullets: ["문장의 중심 성분을 구분합니다."],
        estimatedMinutes: 8,
        totalSteps: 1,
        xpAvailable: 10,
      },
    },
  ],
}

const fakeContentService: ContentService = {
  async listCourseCategories() {
    return { status: "ok", value: courseCategories }
  },
  async getCourseDetail(courseId) {
    if (String(courseId) !== "sentence-structure") {
      return {
        status: "not-found",
        error: {
          code: "course-not-found",
          message: "Course was not found.",
          courseId: String(courseId),
        },
      }
    }

    return { status: "ok", value: courseDetail }
  },
  async getLesson(lessonId) {
    if (String(lessonId) !== "sentence-structure-01") {
      return {
        status: "not-found",
        error: {
          code: "lesson-not-found",
          message: "Lesson was not found.",
          lessonId: String(lessonId),
        },
      }
    }

    return { status: "ok", value: lesson }
  },
}

function createTestApp() {
  return createApiApp({
    async checkDatabase() {
      return true
    },
    contentService: fakeContentService,
  })
}

describe("createApiApp", () => {
  it("returns health status when the database is available", async () => {
    const app = createTestApp()

    const response = await app.request("/health")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      database: "ok",
      status: "ok",
    })
  })

  it("returns unversioned course categories", async () => {
    const app = createTestApp()

    const response = await app.request("/courses")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(courseCategories)
  })

  it("returns a course-not-found DTO for an unknown course", async () => {
    const app = createTestApp()

    const response = await app.request("/courses/not-real")

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      code: "course-not-found",
      message: "Course was not found.",
      courseId: "not-real",
    })
  })

  it("returns a lesson-not-found DTO for an unknown lesson", async () => {
    const app = createTestApp()

    const response = await app.request("/lessons/not-real")

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      code: "lesson-not-found",
      message: "Lesson was not found.",
      lessonId: "not-real",
    })
  })

  it("returns OpenAPI paths without versioned routes", async () => {
    const app = createTestApp()

    const response = await app.request("/openapi.json")
    const document = await response.json()

    expect(response.status).toBe(200)
    expect(document.paths).toHaveProperty("/health")
    expect(document.paths).toHaveProperty("/courses")
    expect(document.paths).toHaveProperty("/courses/{courseId}")
    expect(
      Object.keys(document.paths).some((path) => path.startsWith("/v"))
    ).toBe(false)
  })
})
