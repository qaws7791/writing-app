import { describe, expect, it, vi } from "vitest"

import {
  requestAdminEmailAuth,
  type AdminAuthFetch,
} from "@/lib/auth/admin-auth-client"

describe("requestAdminEmailAuth", () => {
  it("posts admin email credentials with same-origin credentials included", async () => {
    const fetch = vi.fn<AdminAuthFetch>(async () =>
      Response.json({ user: { id: "admin-1" } })
    )

    const result = await requestAdminEmailAuth({
      email: "admin@example.com",
      fetch,
      password: "password-1234",
    })

    expect(result).toEqual({ status: "ok" })
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/sign-in/email",
      expect.objectContaining({
        credentials: "include",
        method: "POST",
      })
    )
    expect(fetch.mock.calls[0]?.[1]?.headers).toEqual({
      "Content-Type": "application/json",
    })
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      email: "admin@example.com",
      password: "password-1234",
    })
  })

  it("uses a configured base URL when provided", async () => {
    const fetch = vi.fn<AdminAuthFetch>(async () =>
      Response.json({ user: { id: "admin-1" } })
    )

    await requestAdminEmailAuth({
      baseUrl: "http://localhost:3001/",
      email: "admin@example.com",
      fetch,
      password: "password-1234",
    })

    expect(fetch.mock.calls[0]?.[0]).toBe(
      "http://localhost:3001/api/auth/sign-in/email"
    )
  })

  it("maps failed responses and fetch failures to the admin login error", async () => {
    const nonOkFetch = vi.fn<AdminAuthFetch>(async () =>
      Response.json(
        { message: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      )
    )
    const rejectedFetch = vi
      .fn<AdminAuthFetch>()
      .mockRejectedValue(new Error("connection refused"))

    await expect(
      requestAdminEmailAuth({
        email: "admin@example.com",
        fetch: nonOkFetch,
        password: "wrong-password",
      })
    ).resolves.toEqual({
      status: "error",
      message: "관리자 로그인에 실패했습니다.",
    })

    await expect(
      requestAdminEmailAuth({
        email: "admin@example.com",
        fetch: rejectedFetch,
        password: "wrong-password",
      })
    ).resolves.toEqual({
      status: "error",
      message: "관리자 로그인에 실패했습니다.",
    })
  })
})
