import { afterEach, describe, expect, it, vi } from "vitest"

import { getBrowserWritingAppApi } from "@/lib/api/get-browser-writing-app-api"

describe("getBrowserWritingAppApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("uses the HTTP API client even when the legacy fake mode env is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_MODE", "fake")
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      expect(input).toBeDefined()

      return Response.json({ categories: [] })
    })
    vi.stubGlobal("fetch", fetch)

    const api = getBrowserWritingAppApi()
    const result = await api.listCourseCategories()

    expect(result.status).toBe("ok")
    const request = fetch.mock.calls[0]?.[0]
    expect(request).toBeInstanceOf(Request)
    if (!(request instanceof Request)) {
      throw new Error("Expected openapi-fetch to call fetch with a Request.")
    }
    expect(request.url).toBe("http://localhost:4000/courses")
  })
})
