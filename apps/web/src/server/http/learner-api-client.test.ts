import { beforeEach, describe, expect, it, vi } from "vitest"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { getProfile } from "@workspace/http-client/learner"

const { cookiesMock, readServerApiBaseUrlMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  readServerApiBaseUrlMock: vi.fn(),
}))

vi.mock("next/headers", () => ({ cookies: cookiesMock }))
vi.mock("@/server/env/runtime-config", () => ({
  readServerApiBaseUrl: readServerApiBaseUrlMock,
}))

import { getServerLearnerRequestOptions } from "@/server/http/learner-api-client"

describe("server learner API client boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    readServerApiBaseUrlMock.mockReturnValue("https://api.example.test")
  })

  it("canonical learner cookie와 server base URL을 generated client에 전달한다", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "learner token" })),
    })
    const fetchMock = vi.fn(async (_request: Request) =>
      Response.json({ stats: {}, user: {} })
    )
    vi.stubGlobal("fetch", fetchMock)

    const options = await getServerLearnerRequestOptions({
      cache: "no-store",
    })
    expect(options).not.toBeNull()
    await getProfile(options ?? undefined)

    const request = fetchMock.mock.calls[0]?.[0]
    expect(request).toBeInstanceOf(Request)
    expect(request?.url).toBe("https://api.example.test/api/profile")
    expect(request?.headers.get("cookie")).toBe(
      `${learnerSessionCookieName}=learner%20token`
    )
    expect(request?.cache).toBe("no-store")
  })

  it("session cookie가 없으면 API 요청 options를 만들지 않는다", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => undefined),
    })

    await expect(getServerLearnerRequestOptions()).resolves.toBeNull()
    expect(readServerApiBaseUrlMock).not.toHaveBeenCalled()
  })
})
