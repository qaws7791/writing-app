import { describe, expect, it, vi } from "vitest"

import {
  createAdminAuthClient,
  isAdminAuthClientError,
} from "#auth/admin/client"

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

  it.each([
    { code: "invalid-credentials", status: 401 },
    { code: "rate-limited", status: 429 },
    { code: "unknown", status: 500 },
  ])("실패 status $status를 $code 코드로 옮긴다", async ({ code, status }) => {
    const client = createAdminAuthClient({
      fetch: vi.fn(async () => new Response(null, { status })),
    })

    for (const request of [
      () => client.signOut(),
      () =>
        client.signInWithPassword({
          callbackURL: "/",
          email: "owner@example.test",
          password: "password",
        }),
    ]) {
      const error = await request().catch((cause: unknown) => cause)

      expect(isAdminAuthClientError(error) && error.code).toBe(code)
    }
  })
})
