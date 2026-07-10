import { afterEach, describe, expect, it, vi } from "vitest"
import { cookies } from "next/headers"

import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}))

const mockedCookies = vi.mocked(cookies)

describe("server admin session token", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it("쿠키 토큰을 우선 사용한다", async () => {
    mockedCookies.mockResolvedValueOnce(createCookieStore("cookie-token"))
    vi.stubEnv("NODE_ENV", "production")

    await expect(getServerAdminSessionToken()).resolves.toBe("cookie-token")
  })

  it("쿠키가 없으면 운영 환경에서도 null을 반환한다", async () => {
    mockedCookies.mockResolvedValueOnce(createCookieStore(null))
    vi.stubEnv("NODE_ENV", "production")

    await expect(getServerAdminSessionToken()).resolves.toBeNull()
  })

  it("쿠키가 없으면 개발 환경에서도 환경 변수 token을 사용하지 않는다", async () => {
    mockedCookies.mockResolvedValueOnce(createCookieStore(null))
    vi.stubEnv("NODE_ENV", "development")

    await expect(getServerAdminSessionToken()).resolves.toBeNull()
  })
})

function createCookieStore(
  value: null | string
): Awaited<ReturnType<typeof cookies>> {
  return {
    get(name: string) {
      if (name !== "admin_session_token" || value === null) {
        return undefined
      }

      return {
        name,
        value,
      }
    },
  } as Awaited<ReturnType<typeof cookies>>
}
