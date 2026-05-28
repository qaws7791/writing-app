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

  it("requests curriculum upgrade notice for a course", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      expect(input).toBeDefined()

      return Response.json({
        completedCount: 1,
        courseId: "sentence-structure",
        fromVersion: {
          id: "sentence-structure-v1",
          title: "문장 구조의 기본",
          versionNumber: 1,
        },
        message: "새 커리큘럼에는 새 예제와 복습 경로를 추가했습니다.",
        migrationId: "sentence-structure-v1-to-sentence-structure-v2",
        status: "available",
        toVersion: {
          changelog: "새 예제와 복습 경로를 추가했습니다.",
          id: "sentence-structure-v2",
          title: "문장 구조의 기본 v2",
          versionNumber: 2,
        },
        totalLessons: 2,
      })
    })
    const api = createHttpWritingAppApi({
      baseUrl: "http://localhost:4000",
      fetch,
    })

    const result = await api.getCurriculumUpgrade("sentence-structure" as never)

    expect(result).toEqual({
      status: "ok",
      value: {
        completedCount: 1,
        courseId: "sentence-structure",
        fromVersion: {
          id: "sentence-structure-v1",
          title: "문장 구조의 기본",
          versionNumber: 1,
        },
        message: "새 커리큘럼에는 새 예제와 복습 경로를 추가했습니다.",
        migrationId: "sentence-structure-v1-to-sentence-structure-v2",
        status: "available",
        toVersion: {
          changelog: "새 예제와 복습 경로를 추가했습니다.",
          id: "sentence-structure-v2",
          title: "문장 구조의 기본 v2",
          versionNumber: 2,
        },
        totalLessons: 2,
      },
    })

    const request = fetch.mock.calls[0]?.[0]
    expect(request).toBeInstanceOf(Request)
    if (!(request instanceof Request)) {
      throw new Error("Expected openapi-fetch to call fetch with a Request.")
    }
    expect(request.url).toBe(
      "http://localhost:4000/courses/sentence-structure/curriculum-upgrade"
    )
  })

  it("posts curriculum upgrade actions", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const request = input instanceof Request ? input : new Request(input)

      if (request.url.endsWith("/dismiss")) {
        return Response.json({
          courseId: "sentence-structure",
          dismissedAt: "2026-05-28T00:00:00.000Z",
          fromVersionId: "sentence-structure-v1",
          status: "dismissed",
          toVersionId: "sentence-structure-v2",
        })
      }

      return Response.json({
        completedLessonCount: 1,
        completedLessonIds: ["sentence-structure-01"],
        courseId: "sentence-structure",
        createdAt: "2026-05-28T00:00:00.000Z",
        fromVersionId: "sentence-structure-v1",
        id: "sentence-structure-v1-to-sentence-structure-v2-user-1",
        migrationId: "sentence-structure-v1-to-sentence-structure-v2",
        preservedLessonIds: [],
        skippedLessonIds: ["sentence-structure-02"],
        status: "completed",
        toVersionId: "sentence-structure-v2",
        updatedAt: "2026-05-28T00:00:00.000Z",
      })
    })
    const api = createHttpWritingAppApi({
      baseUrl: "http://localhost:4000",
      fetch,
    })

    const applied = await api.applyCurriculumUpgrade(
      "sentence-structure" as never
    )
    const dismissed = await api.dismissCurriculumUpgrade(
      "sentence-structure" as never
    )

    expect(applied).toMatchObject({
      status: "ok",
      value: {
        completedLessonCount: 1,
        status: "completed",
      },
    })
    expect(dismissed).toMatchObject({
      status: "ok",
      value: {
        status: "dismissed",
        toVersionId: "sentence-structure-v2",
      },
    })
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
