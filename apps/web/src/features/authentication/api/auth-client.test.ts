import { afterEach, describe, expect, it, vi } from "vitest"
import type {
  createLearnerAuthClient,
  LearnerAuthClient,
} from "@workspace/auth/learner/client"

import { createWebAuthClient } from "@/features/authentication/api/auth-client"
import type { WebAuthClient } from "@/features/authentication/api/auth-client"

const verificationCallbackUrl =
  "http://localhost:3000/login?next=%2Fapp%2Fcourses&verified=true"

describe("auth client", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("로그아웃을 auth package에 위임하고 안전한 이동 경로를 반환한다", async () => {
    const { authClient, learnerAuthClientFactory } = createAuthClientFixture()
    const webAuthClient = createWebAuthClient({
      learnerAuthClientFactory,
    })

    await expect(webAuthClient.requestLogout("/app/profile")).resolves.toBe(
      "/app/profile"
    )
    expect(authClient.signOut).toHaveBeenCalledOnce()
  })

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

  it("이메일 가입은 확인 완료 로그인 경로를 절대 callback URL로 전달한다", async () => {
    const { authClient, webAuthClient } = createBrowserAuthClientFixture()

    await webAuthClient.requestEmailSignUp({
      email: "learner@example.com",
      name: "학습자",
      nextPath: "/app/courses",
      password: "Learner-password-123!",
    })

    expect(authClient.signUpWithEmail).toHaveBeenCalledWith({
      callbackURL: verificationCallbackUrl,
      email: "learner@example.com",
      name: "학습자",
      password: "Learner-password-123!",
    })
  })

  it("이메일 로그인은 next 경로를 절대 callback URL로 전달한다", async () => {
    const { authClient, webAuthClient } = createBrowserAuthClientFixture()

    await webAuthClient.requestEmailLogin({
      email: "learner@example.com",
      nextPath: "/app/courses",
      password: "Learner-password-123!",
    })

    expect(authClient.signInWithEmail).toHaveBeenCalledWith({
      callbackURL: "http://localhost:3000/app/courses",
      email: "learner@example.com",
      password: "Learner-password-123!",
    })
  })

  it("확인 메일 재전송은 확인 완료 로그인 경로를 절대 callback URL로 전달한다", async () => {
    const { authClient, webAuthClient } = createBrowserAuthClientFixture()

    await webAuthClient.requestVerificationEmail({
      email: "learner@example.com",
      nextPath: "/app/courses",
    })

    expect(authClient.resendVerificationEmail).toHaveBeenCalledWith({
      callbackURL: verificationCallbackUrl,
      email: "learner@example.com",
    })
  })

  it("비밀번호 재설정 요청은 절대 redirect URL을 전달한다", async () => {
    const { authClient, webAuthClient } = createBrowserAuthClientFixture()

    await webAuthClient.requestPasswordReset("learner@example.com")

    expect(authClient.requestPasswordReset).toHaveBeenCalledWith({
      email: "learner@example.com",
      redirectTo: "http://localhost:3000/reset-password",
    })
  })
})

function createBrowserAuthClientFixture(): {
  readonly authClient: LearnerAuthClient
  readonly webAuthClient: WebAuthClient
} {
  vi.stubGlobal("window", {
    location: {
      assign: vi.fn(),
      origin: "http://localhost:3000",
    },
  })
  const { authClient, learnerAuthClientFactory } = createAuthClientFixture()

  return {
    authClient,
    webAuthClient: createWebAuthClient({ learnerAuthClientFactory }),
  }
}

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
