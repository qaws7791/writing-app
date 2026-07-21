import { beforeEach, describe, expect, it, vi } from "vitest"

import { createLearnerAuthClient } from "#auth/learner/client"

const authClientMocks = vi.hoisted(() => ({
  createAuthClient: vi.fn(() => ({
    signIn: {
      social: vi.fn(async () => undefined),
    },
  })),
  socialSignIn: vi.fn(async () => undefined),
}))

vi.mock("better-auth/client", () => ({
  createAuthClient: authClientMocks.createAuthClient.mockImplementation(() => ({
    signIn: {
      social: authClientMocks.socialSignIn,
    },
  })),
}))

describe("학습자 인증 client", () => {
  beforeEach(() => {
    authClientMocks.createAuthClient.mockClear()
    authClientMocks.socialSignIn.mockClear()
  })

  it("Google 로그인 callback을 Better Auth client에 전달한다", async () => {
    const fetchImplementation = vi.fn()
    const client = createLearnerAuthClient({
      baseURL: "https://api.example.test",
      fetch: fetchImplementation,
      navigate: vi.fn(),
    })

    await client.signInWithGoogle("https://app.example.test/app/courses")

    expect(authClientMocks.socialSignIn).toHaveBeenCalledWith({
      callbackURL: "https://app.example.test/app/courses",
      provider: "google",
    })
    expect(authClientMocks.createAuthClient).toHaveBeenCalledWith({
      baseURL: "https://api.example.test",
      fetchOptions: { customFetchImpl: fetchImplementation },
    })
  })

  it("테스트 로그인 endpoint로 callback을 인코딩해 이동한다", () => {
    const navigate = vi.fn()
    const client = createLearnerAuthClient({
      baseURL: "https://api.example.test",
      fetch: vi.fn(),
      navigate,
    })

    client.signInForTest("https://app.example.test/app/courses?sort=recent")

    expect(navigate).toHaveBeenCalledWith(
      "https://api.example.test/api/auth/test/sign-in?callbackURL=https%3A%2F%2Fapp.example.test%2Fapp%2Fcourses%3Fsort%3Drecent"
    )
  })

  it("로그아웃 요청에 credential을 포함하고 실패를 거절한다", async () => {
    const fetchImplementation = vi.fn(async () => new Response(null))
    const client = createLearnerAuthClient({
      baseURL: "https://api.example.test/",
      fetch: fetchImplementation,
      navigate: vi.fn(),
    })

    await client.signOut()

    expect(fetchImplementation).toHaveBeenCalledWith(
      "https://api.example.test/api/auth/sign-out",
      {
        credentials: "include",
        method: "POST",
      }
    )

    const failedClient = createLearnerAuthClient({
      baseURL: "https://api.example.test",
      fetch: vi.fn(async () => new Response(null, { status: 500 })),
      navigate: vi.fn(),
    })

    await expect(failedClient.signOut()).rejects.toThrow("Failed to sign out")
  })
})
