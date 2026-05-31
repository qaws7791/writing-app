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

  it("maps invalid credentials to a specific login error", async () => {
    const fetch = vi.fn<AdminAuthFetch>(async () =>
      Response.json(
        { message: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      )
    )

    await expect(
      requestAdminEmailAuth({
        email: "admin@example.com",
        fetch,
        password: "wrong-password",
      })
    ).resolves.toEqual({
      kind: "invalid-credentials",
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      status: "error",
    })
  })

  it("maps rate limits to a specific login error", async () => {
    const fetch = vi.fn<AdminAuthFetch>(async () =>
      Response.json({ message: "Too many requests" }, { status: 429 })
    )

    await expect(
      requestAdminEmailAuth({
        email: "admin@example.com",
        fetch,
        password: "password-1234",
      })
    ).resolves.toEqual({
      kind: "rate-limited",
      message: "로그인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      status: "error",
    })
  })

  it("uses a parsed error body code when status is too generic", async () => {
    const fetch = vi.fn<AdminAuthFetch>(async () =>
      Response.json({ code: "INVALID_CREDENTIALS" }, { status: 400 })
    )

    await expect(
      requestAdminEmailAuth({
        email: "admin@example.com",
        fetch,
        password: "wrong-password",
      })
    ).resolves.toEqual({
      kind: "invalid-credentials",
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      status: "error",
    })
  })

  it("maps server failures to a specific login error", async () => {
    const fetch = vi.fn<AdminAuthFetch>(async () =>
      Response.json({ message: "Internal server error" }, { status: 503 })
    )

    await expect(
      requestAdminEmailAuth({
        email: "admin@example.com",
        fetch,
        password: "password-1234",
      })
    ).resolves.toEqual({
      kind: "server-unavailable",
      message: "관리자 인증 서버를 사용할 수 없습니다.",
      status: "error",
    })
  })

  it("maps fetch failures to a network login error", async () => {
    const fetch = vi
      .fn<AdminAuthFetch>()
      .mockRejectedValue(new Error("connection refused"))

    await expect(
      requestAdminEmailAuth({
        email: "admin@example.com",
        fetch,
        password: "wrong-password",
      })
    ).resolves.toEqual({
      kind: "network-error",
      message: "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
      status: "error",
    })
  })
})
