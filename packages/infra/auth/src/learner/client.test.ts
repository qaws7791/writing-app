import { beforeEach, describe, expect, it, vi } from "vitest"

import { createLearnerAuthClient } from "#auth/learner/client"

type MockAuthResult = {
  readonly data: unknown
  readonly error: {
    readonly code?: string
    readonly message?: string
    readonly status?: number
    readonly statusCode?: number
  } | null
}

const authClientMocks = vi.hoisted(() => ({
  createAuthClient: vi.fn(() => ({
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
    sendVerificationEmail: vi.fn(),
    signIn: {
      email: vi.fn(),
      social: vi.fn(async () => undefined),
    },
    signUp: { email: vi.fn() },
  })),
  emailSignIn: vi.fn<() => Promise<MockAuthResult>>(async () => ({
    data: {},
    error: null,
  })),
  emailSignUp: vi.fn<() => Promise<MockAuthResult>>(async () => ({
    data: {},
    error: null,
  })),
  resendVerificationEmail: vi.fn<() => Promise<MockAuthResult>>(async () => ({
    data: {},
    error: null,
  })),
  requestPasswordReset: vi.fn<() => Promise<MockAuthResult>>(async () => ({
    data: {},
    error: null,
  })),
  resetPassword: vi.fn<() => Promise<MockAuthResult>>(async () => ({
    data: {},
    error: null,
  })),
  socialSignIn: vi.fn(async () => undefined),
}))

vi.mock("better-auth/client", () => ({
  createAuthClient: authClientMocks.createAuthClient.mockImplementation(() => ({
    requestPasswordReset: authClientMocks.requestPasswordReset,
    resetPassword: authClientMocks.resetPassword,
    sendVerificationEmail: authClientMocks.resendVerificationEmail,
    signIn: {
      email: authClientMocks.emailSignIn,
      social: authClientMocks.socialSignIn,
    },
    signUp: {
      email: authClientMocks.emailSignUp,
    },
  })),
}))

describe("학습자 인증 client", () => {
  beforeEach(() => {
    authClientMocks.createAuthClient.mockClear()
    authClientMocks.emailSignIn.mockClear()
    authClientMocks.emailSignUp.mockClear()
    authClientMocks.resendVerificationEmail.mockClear()
    authClientMocks.requestPasswordReset.mockClear()
    authClientMocks.resetPassword.mockClear()
    authClientMocks.socialSignIn.mockClear()
  })

  it("이메일 가입, 로그인과 확인 메일 재전송을 Better Auth client에 전달한다", async () => {
    const client = createLearnerAuthClient({
      fetch: vi.fn(),
    })
    const signUpInput = {
      callbackURL: "https://app.example.test/login?verified=true",
      email: "learner@example.com",
      name: "학습자",
      password: "Learner-password-123!",
    }
    const signInInput = {
      callbackURL: "https://app.example.test/app/courses",
      email: signUpInput.email,
      password: signUpInput.password,
    }
    const resendInput = {
      callbackURL: signUpInput.callbackURL,
      email: signUpInput.email,
    }

    await client.signUpWithEmail(signUpInput)
    await client.signInWithEmail(signInInput)
    await client.resendVerificationEmail(resendInput)

    expect(authClientMocks.emailSignUp).toHaveBeenCalledWith(signUpInput)
    expect(authClientMocks.emailSignIn).toHaveBeenCalledWith(signInInput)
    expect(authClientMocks.resendVerificationEmail).toHaveBeenCalledWith(
      resendInput
    )
  })

  it.each([
    ["PASSWORD_TOO_SHORT", "weak-password"],
    ["USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", "duplicate-email"],
    ["EMAIL_NOT_VERIFIED", "email-not-verified"],
    ["INVALID_EMAIL_OR_PASSWORD", "invalid-credentials"],
  ] as const)(
    "Better Auth %s를 %s 오류로 정규화한다",
    async (code, expected) => {
      authClientMocks.emailSignUp.mockResolvedValueOnce({
        data: null,
        error: { code, status: 400 },
      })
      const client = createLearnerAuthClient({
        fetch: vi.fn(),
      })

      await expect(
        client.signUpWithEmail({
          callbackURL: "https://app.example.test/login?verified=true",
          email: "learner@example.com",
          name: "학습자",
          password: "password",
        })
      ).rejects.toMatchObject({
        code: expected,
        message: `Learner authentication failed: ${expected}`,
      })
    }
  )

  it("재전송 429와 provider 실패를 제한·전달 실패로만 노출한다", async () => {
    authClientMocks.resendVerificationEmail
      .mockResolvedValueOnce({
        data: null,
        error: { status: 429 },
      })
      .mockResolvedValueOnce({
        data: null,
        error: { code: "INTERNAL_SERVER_ERROR", message: "provider body" },
      })
    const client = createLearnerAuthClient({
      fetch: vi.fn(),
    })
    const input = {
      callbackURL: "https://app.example.test/login?verified=true",
      email: "learner@example.com",
    }

    await expect(client.resendVerificationEmail(input)).rejects.toMatchObject({
      code: "rate-limited",
    })
    await expect(client.resendVerificationEmail(input)).rejects.toMatchObject({
      code: "email-delivery-failed",
      message: "Learner authentication failed: email-delivery-failed",
    })
  })

  it("Google 로그인 callback을 Better Auth client에 전달한다", async () => {
    const fetchImplementation = vi.fn()
    const client = createLearnerAuthClient({
      fetch: fetchImplementation,
    })

    await client.signInWithGoogle({
      callbackURL: "https://app.example.test/app/courses",
      errorCallbackURL: "https://app.example.test/login?authError=true",
    })

    expect(authClientMocks.socialSignIn).toHaveBeenCalledWith({
      callbackURL: "https://app.example.test/app/courses",
      errorCallbackURL: "https://app.example.test/login?authError=true",
      provider: "google",
    })
    expect(authClientMocks.createAuthClient).toHaveBeenCalledWith({
      fetchOptions: { customFetchImpl: fetchImplementation },
    })
  })

  it("비밀번호 재설정 요청과 완료를 Better Auth client에 전달한다", async () => {
    const client = createLearnerAuthClient({
      fetch: vi.fn(),
    })
    const requestInput = {
      email: "learner@example.com",
      redirectTo: "https://app.example.test/reset-password",
    }
    const resetInput = {
      newPassword: "New-learner-password-123!",
      token: "reset-token",
    }

    await client.requestPasswordReset(requestInput)
    await client.resetPassword(resetInput)

    expect(authClientMocks.requestPasswordReset).toHaveBeenCalledWith(
      requestInput
    )
    expect(authClientMocks.resetPassword).toHaveBeenCalledWith(resetInput)
  })

  it("만료되거나 사용한 reset token을 일반화된 오류로 정규화한다", async () => {
    authClientMocks.resetPassword.mockResolvedValueOnce({
      data: null,
      error: { code: "INVALID_TOKEN", message: "provider detail" },
    })
    const client = createLearnerAuthClient({ fetch: vi.fn() })

    await expect(
      client.resetPassword({
        newPassword: "New-learner-password-123!",
        token: "used-token",
      })
    ).rejects.toMatchObject({
      code: "invalid-reset-token",
      message: "Learner authentication failed: invalid-reset-token",
    })
  })

  it("로그아웃 요청에 credential을 포함하고 실패를 거절한다", async () => {
    const fetchImplementation = vi.fn(async () => new Response(null))
    const client = createLearnerAuthClient({
      fetch: fetchImplementation,
    })

    await client.signOut()

    expect(fetchImplementation).toHaveBeenCalledWith("/api/auth/sign-out", {
      credentials: "include",
      method: "POST",
    })

    const failedClient = createLearnerAuthClient({
      fetch: vi.fn(async () => new Response(null, { status: 500 })),
    })

    await expect(failedClient.signOut()).rejects.toThrow("Failed to sign out")
  })
})
