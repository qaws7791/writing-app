import { afterEach, describe, expect, it, vi } from "vitest"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import {
  requestAdminPasswordChange,
  requestAdminPasswordLogin,
} from "@/lib/auth/admin-auth-client"

describe("admin auth client", () => {
  afterEach(() => {
    delete process.env["NEXT_PUBLIC_ADMIN_API_BASE_URL"]
    vi.unstubAllGlobals()
  })

  it("관리자 API의 Better Auth email/password 로그인 endpoint를 직접 호출한다", async () => {
    const fetch = vi.fn(async () => Response.json({ user: { id: "admin-1" } }))

    process.env["NEXT_PUBLIC_ADMIN_API_BASE_URL"] =
      `${localRuntimeDefaults.adminApiBaseUrl}//`
    vi.stubGlobal("fetch", fetch)

    await expect(
      requestAdminPasswordLogin({
        email: "admin@example.com",
        nextPath: "/courses",
        password: "admin-password-123",
      })
    ).resolves.toEqual({ nextPath: "/courses" })

    expect(fetch).toHaveBeenCalledWith(
      `${localRuntimeDefaults.adminApiBaseUrl}/api/auth/sign-in/email`,
      expect.objectContaining({
        body: JSON.stringify({
          callbackURL: "/courses",
          email: "admin@example.com",
          password: "admin-password-123",
        }),
        credentials: "include",
        method: "POST",
      })
    )
  })

  it("관리자 로그인 실패를 예외로 반환한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 }))
    )

    let caughtError: unknown
    try {
      await requestAdminPasswordLogin({
        email: "admin@example.com",
        nextPath: "/courses",
        password: "wrong-password",
      })
    } catch (error) {
      caughtError = error
    }

    expect(caughtError).toBeInstanceOf(Error)
    expect((caughtError as Error).message).toBe("Failed to sign in")
  })

  it("비밀번호 변경은 다른 모든 세션 폐기를 강제한다", async () => {
    const fetch = vi.fn(async () => Response.json({ status: true }))
    vi.stubGlobal("fetch", fetch)

    await requestAdminPasswordChange({
      currentPassword: "old-password",
      newPassword: "new-password",
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/change-password"),
      expect.objectContaining({
        body: JSON.stringify({
          currentPassword: "old-password",
          newPassword: "new-password",
          revokeOtherSessions: true,
        }),
      })
    )
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
