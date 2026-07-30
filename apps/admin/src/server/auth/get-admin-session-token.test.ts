import { describe, expect, it, vi } from "vitest"
import { cookies } from "next/headers"

import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}))

const mockedCookies = vi.mocked(cookies)

describe("server admin session token", () => {
  it("관리자 세션 쿠키가 있으면 그 토큰을 반환한다", async () => {
    mockedCookies.mockResolvedValueOnce(createCookieStore("cookie-token"))

    await expect(getServerAdminSessionToken()).resolves.toBe("cookie-token")
  })

  it("관리자 세션 쿠키가 없으면 null을 반환한다", async () => {
    mockedCookies.mockResolvedValueOnce(createCookieStore(null))

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
