import { describe, expect, it, vi } from "vitest"

import { lessonId } from "@/features/lessons/lesson-ids"
import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"

describe("createHttpWritingAppApi", () => {
  it("requests course categories with credentials", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      expect(input).toBeDefined()

      return Response.json({
        categories: [],
      })
    })
    const api = createHttpWritingAppApi({
      baseUrl: "http://localhost:4000",
      fetch,
    })

    const result = await api.listCourseCategories()

    expect(result.status).toBe("ok")
    const request = fetch.mock.calls[0]?.[0]
    expect(request).toBeInstanceOf(Request)
    if (!(request instanceof Request)) {
      throw new Error("Expected openapi-fetch to call fetch with a Request.")
    }
    expect(request.url).toBe("http://localhost:4000/courses")
    expect(request.credentials).toBe("include")
  })

  it("maps HTTP errors", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      expect(input).toBeDefined()

      return Response.json(
        {
          code: "unauthorized",
          message: "로그인이 필요합니다.",
        },
        { status: 401 }
      )
    })
    const api = createHttpWritingAppApi({
      baseUrl: "http://localhost:4000",
      fetch,
    })

    await expect(api.getCurrentUser()).resolves.toEqual({
      status: "error",
      error: {
        code: "unauthorized",
        message: "로그인이 필요합니다.",
      },
    })
  })

  it("maps invalid success response bodies to contract errors", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      expect(input).toBeDefined()

      return Response.json({
        id: "sentence-structure-01",
        title: "주어 찾기",
        categoryId: "beginner",
        courseId: "sentence-structure",
        unitNumber: 1,
        steps: [
          {
            id: "sentence-structure-01-step-1",
            type: "INTRO",
            order: 1,
            points: 10,
            required: true,
            content: {
              title: "주어 찾기",
            },
          },
        ],
      })
    })
    const api = createHttpWritingAppApi({
      baseUrl: "http://localhost:4000",
      fetch,
    })

    await expect(
      api.getLesson(lessonId("sentence-structure-01"))
    ).resolves.toEqual({
      status: "error",
      error: {
        code: "contract-error",
        message: "서버 응답이 예상한 계약과 일치하지 않습니다.",
      },
    })
  })

  it("requests the authenticated learner progress list", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      expect(input).toBeDefined()

      return Response.json({
        courses: [
          {
            completedCount: 1,
            courseDescription: "문장의 뼈대를 이해합니다.",
            courseId: "sentence-structure",
            courseTitle: "문장 구조의 기본",
            lessons: [
              {
                lessonId: "sentence-structure-01",
                status: "completed",
                title: "주어와 서술어 찾기",
              },
              {
                lessonId: "sentence-structure-02",
                status: "next-up",
                title: "목적어와 보어의 자리",
              },
            ],
            nextLessonId: "sentence-structure-02",
            progressPercent: 50,
            totalLessons: 2,
          },
        ],
      })
    })
    const api = createHttpWritingAppApi({
      baseUrl: "http://localhost:4000",
      fetch,
    })

    const result = await api.listProgress()

    expect(result).toEqual({
      status: "ok",
      value: {
        courses: [
          {
            completedLessons: 1,
            courseDescription: "문장의 뼈대를 이해합니다.",
            courseId: "sentence-structure",
            courseTitle: "문장 구조의 기본",
            lessons: [
              {
                lessonId: "sentence-structure-01",
                status: "completed",
                title: "주어와 서술어 찾기",
              },
              {
                lessonId: "sentence-structure-02",
                status: "next-up",
                title: "목적어와 보어의 자리",
              },
            ],
            nextLessonId: "sentence-structure-02",
            percentage: 50,
            totalLessons: 2,
          },
        ],
      },
    })

    const request = fetch.mock.calls[0]?.[0]
    expect(request).toBeInstanceOf(Request)
    if (!(request instanceof Request)) {
      throw new Error("Expected openapi-fetch to call fetch with a Request.")
    }
    expect(request.url).toBe("http://localhost:4000/progress")
  })
})
