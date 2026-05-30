import { describe, expect, it, vi } from "vitest"

import { createHttpAdminApi } from "@/lib/api/http-admin-api"

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  })
}

function getRequest(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>) {
  const request = fetchMock.mock.calls[0]?.[0]

  expect(request).toBeInstanceOf(Request)

  if (!(request instanceof Request)) {
    throw new Error("Expected fetch to be called with a Request.")
  }

  return request
}

describe("createHttpAdminApi", () => {
  it("requests paginated courses with query", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        courses: [],
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 1,
        },
        query: "문장",
      })
    )
    const api = createHttpAdminApi({
      baseUrl: "http://localhost:4001",
      fetch: fetchMock,
    })

    await api.listCourses({ page: 1, pageSize: 10, query: "문장" })

    const request = getRequest(fetchMock)
    expect(request.url).toBe(
      "http://localhost:4001/courses?page=1&pageSize=10&query=%EB%AC%B8%EC%9E%A5"
    )
    expect(request.credentials).toBe("include")
    expect(request.method).toBe("GET")
  })

  it("requests the course tree with credentials included", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        courses: [],
      })
    )
    const api = createHttpAdminApi({
      baseUrl: "http://localhost:4001",
      fetch: fetchMock,
    })

    await api.listCourseTree()

    expect(fetchMock).toHaveBeenCalledOnce()
    const request = getRequest(fetchMock)
    expect(request.url).toBe(
      "http://localhost:4001/courses?include=chapters%2Clessons"
    )
    expect(request.credentials).toBe("include")
    expect(request.method).toBe("GET")
  })

  it("requests the user list with credentials included", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        users: [],
      })
    )
    const api = createHttpAdminApi({
      baseUrl: "http://localhost:4001",
      fetch: fetchMock,
    })

    await api.listUsers()

    expect(fetchMock).toHaveBeenCalledOnce()
    const request = getRequest(fetchMock)
    expect(request.url).toBe("http://localhost:4001/users")
    expect(request.credentials).toBe("include")
    expect(request.method).toBe("GET")
  })

  it("requests course detail", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        id: "sentence-structure",
        title: "기초 문장 만들기",
        description: "설명",
        sortOrder: 1,
      })
    )
    const api = createHttpAdminApi({
      baseUrl: "http://localhost:4001",
      fetch: fetchMock,
    })

    await api.getCourseDetail("sentence-structure")

    const request = getRequest(fetchMock)
    expect(request.url).toBe("http://localhost:4001/courses/sentence-structure")
    expect(request.method).toBe("GET")
  })

  it("requests the direct current curriculum editor document", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        course: {
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "설명",
          sortOrder: 1,
        },
        revision: 0,
        curriculum: {
          chapters: [],
          steps: [],
        },
      })
    )
    const api = createHttpAdminApi({
      baseUrl: "http://localhost:4001",
      fetch: fetchMock,
    })

    await api.getCourseEditorDocument("sentence-structure")

    const request = getRequest(fetchMock)
    expect(request.url).toBe(
      "http://localhost:4001/courses/sentence-structure/editor"
    )
    expect(request.method).toBe("GET")
    expect(request.credentials).toBe("include")
  })

  it("requests lesson detail without a selected curriculum version", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        id: "sentence-structure-01",
        courseId: "sentence-structure",
        title: "주어와 서술어 찾기",
        categoryId: "grammar",
        unitNumber: 1,
        nextLessonId: null,
        steps: [],
      })
    )
    const api = createHttpAdminApi({
      baseUrl: "http://localhost:4001",
      fetch: fetchMock,
    })

    await api.getCourseLessonDetail(
      "sentence-structure",
      "sentence-structure-01"
    )

    const request = getRequest(fetchMock)
    expect(request.url).toBe(
      "http://localhost:4001/courses/sentence-structure/lessons/sentence-structure-01"
    )
    expect(request.method).toBe("GET")
  })

  it("saves an editor document with PUT body", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        course: {
          id: "sentence-structure",
          title: "기초 문장 만들기",
          description: "설명",
          sortOrder: 1,
        },
        revision: 1,
        curriculum: {
          chapters: [],
          steps: [],
        },
      })
    )
    const api = createHttpAdminApi({
      baseUrl: "http://localhost:4001",
      fetch: fetchMock,
    })

    await api.saveCourseEditorDocument({
      courseId: "sentence-structure",
      expectedRevision: 0,
      course: {
        title: "기초 문장 만들기",
        description: "설명",
        sortOrder: 1,
      },
      chapters: [],
      lessons: [],
      steps: [],
    })

    const request = getRequest(fetchMock)
    expect(request.url).toBe(
      "http://localhost:4001/courses/sentence-structure/editor"
    )
    expect(request.method).toBe("PUT")
    expect(request.headers.get("content-type")).toBe("application/json")
    await expect(request.json()).resolves.toMatchObject({
      courseId: "sentence-structure",
      expectedRevision: 0,
    })
  })

  it("passes configured headers to the API request", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        users: [],
      })
    )
    const api = createHttpAdminApi({
      baseUrl: "http://localhost:4001",
      fetch: fetchMock,
      headers: {
        cookie: "writing-app-admin.session=s1",
      },
    })

    await api.listUsers()

    const request = getRequest(fetchMock)
    expect(request.headers.get("cookie")).toBe("writing-app-admin.session=s1")
  })

  it("maps non-ok responses to an explicit error result", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse(
        {
          code: "database-unavailable",
          message: "데이터베이스를 사용할 수 없습니다.",
        },
        { status: 503 }
      )
    )
    const api = createHttpAdminApi({
      baseUrl: "http://localhost:4001",
      fetch: fetchMock,
    })

    await expect(api.listUsers()).resolves.toEqual({
      status: "error",
      error: {
        code: "database-unavailable",
        message: "데이터베이스를 사용할 수 없습니다.",
      },
      httpStatus: 503,
    })
  })

  it("maps fetch failures to an explicit error result", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("connection refused"))
    const api = createHttpAdminApi({
      baseUrl: "http://localhost:4001",
      fetch: fetchMock,
    })

    await expect(api.listUsers()).resolves.toEqual({
      status: "error",
      error: {
        code: "unknown-error",
        message: "관리자 API 요청에 실패했습니다.",
      },
      httpStatus: 0,
    })
  })

  it("maps invalid successful JSON responses to an explicit error result", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("<html></html>"))
    const api = createHttpAdminApi({
      baseUrl: "http://localhost:4001",
      fetch: fetchMock,
    })

    await expect(api.listUsers()).resolves.toEqual({
      status: "error",
      error: {
        code: "unknown-error",
        message: "관리자 API 요청에 실패했습니다.",
      },
      httpStatus: 0,
    })
  })
})
