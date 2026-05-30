import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    toString: (): string => "better-auth.session=abc",
  })),
}))

import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

describe("getServerWritingAppApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("uses the HTTP API client with forwarded cookies even when the legacy fake mode env is set", async () => {
    vi.stubEnv("WEB_API_MODE", "fake")
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      expect(input).toBeDefined()

      return Response.json({ categories: [] })
    })
    vi.stubGlobal("fetch", fetch)

    const api = await getServerWritingAppApi()
    const result = await api.listCourseCategories()

    expect(result.status).toBe("ok")
    const request = fetch.mock.calls[0]?.[0]
    expect(request).toBeInstanceOf(Request)
    if (!(request instanceof Request)) {
      throw new Error("Expected openapi-fetch to call fetch with a Request.")
    }
    expect(request.url).toBe("http://localhost:4000/courses")
    expect(request.headers.get("cookie")).toBe("better-auth.session=abc")
  })
})
