import { describe, expect, it, vi } from "vitest"

import { createHttpAdminApi } from "@/lib/api/http-admin-api"

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  })
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
    expect(fetchMock).toHaveBeenCalledWith(
      new Request("http://localhost:4001/courses?include=chapters%2Clessons", {
        credentials: "include",
        method: "GET",
      })
    )
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
    expect(fetchMock).toHaveBeenCalledWith(
      new Request("http://localhost:4001/users", {
        credentials: "include",
        method: "GET",
      })
    )
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
})
