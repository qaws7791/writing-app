import { describe, expect, it, vi } from "vitest"

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
          message: "Authentication is required.",
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
        message: "Authentication is required.",
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
            courseId: "sentence-structure",
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
            courseId: "sentence-structure",
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
