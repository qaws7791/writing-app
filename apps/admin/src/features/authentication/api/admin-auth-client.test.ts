import { afterEach, describe, expect, it, vi } from "vitest"

import {
  requestAdminPasswordChange,
  requestAdminPasswordLogin,
} from "@/features/authentication/api/admin-auth-client"

type StubbedFetch = ReturnType<typeof stubOkFetch>

describe("admin auth client", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("안전한 내부 경로는 로그인 callback과 이동 경로에 그대로 쓴다", async () => {
    const fetch = stubOkFetch()

    await expect(
      requestAdminPasswordLogin({
        email: "admin@example.com",
        nextPath: "/courses",
        password: "admin-password-123",
      })
    ).resolves.toEqual({ nextPath: "/courses" })
    expect(readSignInCallbackUrl(fetch)).toBe("/courses")
  })

  it.each(["https://evil.example", "//evil.example"])(
    "외부 URL %s은 로그인 callback과 이동 경로 모두에서 관리자 홈으로 내려앉는다",
    async (nextPath) => {
      const fetch = stubOkFetch()

      await expect(
        requestAdminPasswordLogin({
          email: "admin@example.com",
          nextPath,
          password: "admin-password-123",
        })
      ).resolves.toEqual({ nextPath: "/" })
      expect(readSignInCallbackUrl(fetch)).toBe("/")
    }
  )

  it("관리자 로그인 실패를 예외로 알린다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 }))
    )

    await expect(
      requestAdminPasswordLogin({
        email: "admin@example.com",
        nextPath: "/courses",
        password: "wrong-password",
      })
    ).rejects.toThrow("Failed to sign in")
  })

  it("비밀번호 변경 실패를 성공으로 삼키지 않는다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 400 }))
    )

    await expect(
      requestAdminPasswordChange({
        currentPassword: "old-password",
        newPassword: "new-password",
      })
    ).rejects.toThrow()
  })
})

function stubOkFetch() {
  const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
    Response.json({ user: { id: "admin-1" } })
  )
  vi.stubGlobal("fetch", fetch)

  return fetch
}

function readSignInCallbackUrl(fetch: StubbedFetch): unknown {
  const [, init] = fetch.mock.calls[0] ?? []
  const body = JSON.parse(String(init?.body)) as {
    readonly callbackURL?: unknown
  }

  return body.callbackURL
}
