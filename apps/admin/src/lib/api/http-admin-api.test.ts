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
          message: "Database is unavailable.",
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
        message: "Database is unavailable.",
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
        message: "Admin API request failed.",
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
        message: "Admin API request failed.",
      },
      httpStatus: 0,
    })
  })
})
