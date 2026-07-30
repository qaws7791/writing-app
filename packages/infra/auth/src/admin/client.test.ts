import { describe, expect, it, vi } from "vitest"

import { createAdminAuthClient } from "#auth/admin/client"

describe("관리자 인증 client", () => {
  it("비밀번호 변경은 다른 session 폐기를 항상 강제한다", async () => {
    const fetchImplementation = vi.fn(async () => new Response(null))
    const client = createAdminAuthClient({
      fetch: fetchImplementation,
    })

    await client.changePassword({
      currentPassword: "current",
      newPassword: "changed",
    })

    expect(fetchImplementation).toHaveBeenCalledWith(
      "/api/admin/auth/change-password",
      expect.objectContaining({
        body: JSON.stringify({
          currentPassword: "current",
          newPassword: "changed",
          revokeOtherSessions: true,
        }),
      })
    )
  })

  it("로그아웃 실패와 인증 요청 실패를 구분해 거절한다", async () => {
    const client = createAdminAuthClient({
      fetch: vi.fn(async () => new Response(null, { status: 401 })),
    })

    await expect(client.signOut()).rejects.toThrow("Failed to sign out")
    await expect(
      client.signInWithPassword({
        callbackURL: "/",
        email: "owner@example.test",
        password: "password",
      })
    ).rejects.toThrow("Failed to sign in")
  })
})
