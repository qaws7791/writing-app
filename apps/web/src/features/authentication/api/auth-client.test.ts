import { describe, expect, it, vi } from "vitest"
import type {
  createLearnerAuthClient,
  LearnerAuthClient,
} from "@workspace/auth/learner/client"

import { createWebAuthClient } from "@/features/authentication/api/auth-client"

describe("auth client", () => {
  it("로그아웃 후 이동 경로는 외부 URL을 허용하지 않는다", async () => {
    const { learnerAuthClientFactory } = createAuthClientFixture()
    const authClient = createWebAuthClient({
      learnerAuthClientFactory,
    })

    await expect(authClient.requestLogout("https://example.com")).resolves.toBe(
      "/app"
    )
  })

  it("Google 로그인 요청은 runtime 의존성과 안전한 callback URL을 전달한다", async () => {
    vi.stubGlobal("window", {
      location: {
        assign: vi.fn(),
        origin: "http://localhost:3000",
      },
    })
    const fetch = vi.fn(async () => Response.json({ success: true }))
    const { authClient, learnerAuthClientFactory } = createAuthClientFixture()
    const webAuthClient = createWebAuthClient({
      fetchImplementation: fetch,
      learnerAuthClientFactory,
    })

    await webAuthClient.requestGoogleLogin("/app/courses")

    expect(learnerAuthClientFactory).toHaveBeenCalledWith({
      fetch,
    })
    expect(authClient.signInWithGoogle).toHaveBeenCalledWith({
      callbackURL: "http://localhost:3000/app/courses",
      errorCallbackURL: "http://localhost:3000/login?authError=true",
    })
  })
})

function createAuthClientFixture(): {
  readonly authClient: LearnerAuthClient
  readonly learnerAuthClientFactory: LearnerAuthClientFactory
} {
  const authClient: LearnerAuthClient = {
    requestPasswordReset: vi.fn(async () => undefined),
    resendVerificationEmail: vi.fn(async () => undefined),
    resetPassword: vi.fn(async () => undefined),
    signInWithEmail: vi.fn(async () => undefined),
    signInWithGoogle: vi.fn(async () => undefined),
    signUpWithEmail: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
  }

  return {
    authClient,
    learnerAuthClientFactory: vi.fn(() => authClient),
  }
}

type LearnerAuthClientFactory = (
  input: Parameters<typeof createLearnerAuthClient>[0]
) => LearnerAuthClient
