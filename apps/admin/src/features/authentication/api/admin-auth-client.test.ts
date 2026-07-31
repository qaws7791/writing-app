import { describe, expect, it, vi } from "vitest"

import {
  readAdminLoginErrorMessage,
  requestAdminPasswordLogin,
} from "@/features/authentication/api/admin-auth-client"

type StubbedFetch = ReturnType<typeof stubOkFetch>

describe("admin auth client", () => {
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

  it.each([
    { message: "이메일 또는 비밀번호를 확인하세요.", status: 401 },
    {
      message:
        "로그인 시도가 많아 잠시 차단되었습니다. 1분 뒤에 다시 시도하세요.",
      status: 429,
    },
    {
      message: "로그인하지 못했습니다. 잠시 뒤에 다시 시도하세요.",
      status: 500,
    },
  ])(
    "로그인 실패 $status를 구분되는 한국어 안내로 옮긴다",
    async (expected) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(null, { status: expected.status }))
      )

      const error = await requestAdminPasswordLogin({
        email: "admin@example.com",
        nextPath: "/courses",
        password: "wrong-password",
      }).catch((cause: unknown) => cause)

      expect(readAdminLoginErrorMessage(error)).toBe(expected.message)
    }
  )
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
