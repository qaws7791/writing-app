import { afterEach, describe, expect, test } from "vitest"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { okAsync, errAsync } from "neverthrow"

import {
  createEmptyWritingContent,
  toWritingId,
  toPromptId,
  type WritingId,
} from "@workspace/core"
import { writingNotFound } from "@workspace/core/modules/writings"

import { createApp } from "../app.js"
import { createDevEmailInbox, createDevEmailPort } from "./auth-email.js"
import { createSilentLogger } from "../observability/logger.js"

type TestApp = ReturnType<typeof createApp>

const cleanupTasks: Array<() => void> = []

afterEach(() => {
  while (cleanupTasks.length > 0) {
    cleanupTasks.pop()?.()
  }
})

function setup(): { app: TestApp } {
  const inbox = createDevEmailInbox()
  const emailPort = createDevEmailPort({
    exposeSensitiveData: true,
    inbox,
    logger: createSilentLogger(),
  })
  const auth = betterAuth({
    baseURL: "http://127.0.0.1:3010/api/auth",
    database: memoryAdapter({
      account: [],
      session: [],
      user: [],
      verification: [],
    }),
    emailAndPassword: {
      autoSignIn: false,
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: true,
      sendResetPassword: async ({ token, url, user }) => {
        await emailPort.sendPasswordResetEmail({
          email: user.email,
          token,
          url,
        })
      },
    },
    emailVerification: {
      autoSignInAfterVerification: false,
      sendOnSignUp: true,
      sendVerificationEmail: async ({ token, url, user }) => {
        await emailPort.sendVerificationEmail({
          email: user.email,
          token,
          url,
        })
      },
    },
    secret: "test-secret-test-secret-test-secret",
    trustedOrigins: ["http://127.0.0.1:3000"],
  })

  cleanupTasks.push(() => inbox.clear())

  const app = createApp({
    allowedOrigins: ["http://127.0.0.1:3000"],
    apiBaseUrl: "http://127.0.0.1:4000",
    authDebugEnabled: true,
    getSession: (request) => auth.api.getSession({ headers: request.headers }),
    logger: createSilentLogger(),
    useCases: {
      aiUseCases: {
        async getSuggestions() {
          return []
        },
        async getDocumentReview() {
          return []
        },
        async getFlowReview() {
          return []
        },
      },
      authHandler: auth.handler,
      autosaveWritingUseCase(_userId: string, writingId: WritingId) {
        return okAsync({
          characterCount: 0,
          content: createEmptyWritingContent(),
          createdAt: "2026-03-20T00:00:00.000Z",
          id: writingId,
          lastSavedAt: "2026-03-20T00:00:00.000Z",
          preview: "",
          sourcePromptId: null,
          title: "",
          updatedAt: "2026-03-20T00:00:00.000Z",
          wordCount: 0,
        })
      },
      createWritingUseCase() {
        return okAsync({
          characterCount: 0,
          content: createEmptyWritingContent(),
          createdAt: "2026-03-20T00:00:00.000Z",
          id: toWritingId(1),
          lastSavedAt: "2026-03-20T00:00:00.000Z",
          preview: "",
          sourcePromptId: null,
          title: "",
          updatedAt: "2026-03-20T00:00:00.000Z",
          wordCount: 0,
        })
      },
      deleteWritingUseCase() {
        return okAsync(undefined as void)
      },
      getWritingUseCase() {
        return okAsync({
          characterCount: 0,
          content: createEmptyWritingContent(),
          createdAt: "2026-03-20T00:00:00.000Z",
          id: toWritingId(1),
          lastSavedAt: "2026-03-20T00:00:00.000Z",
          preview: "",
          sourcePromptId: null,
          title: "",
          updatedAt: "2026-03-20T00:00:00.000Z",
          wordCount: 0,
        })
      },
      listWritingsUseCase() {
        return okAsync({ items: [], nextCursor: null, hasMore: false })
      },
      getHomeUseCase() {
        return okAsync({
          recentWritings: [],
          resumeWriting: null,
          savedPrompts: [],
          todayPrompts: [],
        })
      },
      getPromptUseCase() {
        return okAsync({
          description: "",
          id: toPromptId(1),
          level: 1 as const,
          outline: [],
          saved: false,
          suggestedLengthLabel: "짧음" as const,
          tags: [],
          text: "테스트 글감",
          tips: [],
          topic: "일상" as const,
        })
      },
      listPromptsUseCase() {
        return okAsync([])
      },
      savePromptUseCase() {
        return okAsync({
          savedAt: "2026-03-20T00:00:00.000Z",
        })
      },
      unsavePromptUseCase() {
        return okAsync(undefined as void)
      },
      readLatestAuthEmail: inbox.readLatestMessage,
      sqliteVersion: "memory",
      pushTransactionsUseCase() {
        return errAsync(writingNotFound("stub"))
      },
      pullDocumentUseCase() {
        return errAsync(writingNotFound("stub"))
      },
      listVersionsUseCase() {
        return okAsync({ items: [], nextCursor: null, hasMore: false })
      },
      getVersionUseCase() {
        return errAsync(writingNotFound("stub"))
      },
    },
  })

  return { app }
}

async function readJson<TResponse>(response: Response): Promise<TResponse> {
  return (await response.json()) as TResponse
}

function createEmailAddress(label: string): string {
  return `${label}-${Date.now()}@example.com`
}

async function signUp(app: TestApp, email: string) {
  return app.request("/api/auth/sign-up/email", {
    body: JSON.stringify({
      callbackURL: "http://127.0.0.1:3000/sign-in?verified=1",
      email,
      name: "테스트 사용자",
      password: "password1234",
    }),
    headers: {
      "content-type": "application/json",
      origin: "http://127.0.0.1:3000",
    },
    method: "POST",
  })
}

async function signIn(
  app: TestApp,
  input: {
    email: string
    password: string
  }
) {
  return app.request("/api/auth/sign-in/email", {
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
      origin: "http://127.0.0.1:3000",
    },
    method: "POST",
  })
}

async function readLatestEmail(
  app: TestApp,
  input: {
    email: string
    kind: "password-reset" | "verification"
  }
) {
  const response = await app.request(
    `/dev/auth-emails?kind=${input.kind}&email=${encodeURIComponent(input.email)}`
  )

  expect(response.status).toBe(200)

  return readJson<{
    sentAt: string
    token: string
    url: string
  }>(response)
}

async function verifyEmail(app: TestApp, email: string): Promise<void> {
  const message = await readLatestEmail(app, {
    email,
    kind: "verification",
  })
  const url = new URL(message.url)
  const response = await app.request(`${url.pathname}${url.search}`)

  expect(response.status).toBe(302)
  expect(response.headers.get("location")).toBe(
    "http://127.0.0.1:3000/sign-in?verified=1"
  )
}

async function extractResetToken(app: TestApp, email: string): Promise<string> {
  const message = await readLatestEmail(app, {
    email,
    kind: "password-reset",
  })
  const resetUrl = new URL(message.url)
  const directToken = resetUrl.searchParams.get("token")

  if (directToken) {
    return directToken
  }

  const response = await app.request(`${resetUrl.pathname}${resetUrl.search}`)
  const location = response.headers.get("location")

  if (!location) {
    throw new Error("비밀번호 재설정 토큰을 찾지 못했습니다.")
  }

  const redirectedUrl = new URL(location)
  const redirectedToken = redirectedUrl.searchParams.get("token")

  if (!redirectedToken) {
    throw new Error("리다이렉트된 비밀번호 재설정 토큰이 없습니다.")
  }

  return redirectedToken
}

describe("auth", () => {
  test("requires authentication for protected routes", async () => {
    const { app } = setup()

    const response = await app.request("/home")
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(401)
    expect(body.error.code).toBe("unauthorized")
  })

  test("supports sign-up, email verification, sign-in, and session lookup", async () => {
    const { app } = setup()
    const email = createEmailAddress("auth-session")

    const signUpResponse = await signUp(app, email)
    const signInBeforeVerification = await signIn(app, {
      email,
      password: "password1234",
    })

    expect(signUpResponse.ok).toBeTruthy()
    expect(signInBeforeVerification.status).toBeGreaterThanOrEqual(400)

    await verifyEmail(app, email)

    const signInResponse = await signIn(app, {
      email,
      password: "password1234",
    })
    const cookie = signInResponse.headers.get("set-cookie")

    expect(signInResponse.status).toBe(200)
    expect(cookie).toContain("better-auth.session_token")

    const sessionResponse = await app.request("/session", {
      headers: {
        cookie: cookie ?? "",
      },
    })
    const sessionBody = await readJson<{
      session: { userId: string }
      user: { email: string; emailVerified: boolean; id: string }
    }>(sessionResponse)

    expect(sessionResponse.status).toBe(200)
    expect(sessionBody.user.email).toBe(email)
    expect(sessionBody.user.emailVerified).toBe(true)
    expect(sessionBody.session.userId).toBe(sessionBody.user.id)

    const homeResponse = await app.request("/home", {
      headers: {
        cookie: cookie ?? "",
      },
    })

    expect(homeResponse.status).toBe(200)
  })

  test("supports password reset and rejects the old password afterwards", async () => {
    const { app } = setup()
    const email = createEmailAddress("auth-reset")

    await signUp(app, email)
    await verifyEmail(app, email)

    const requestReset = await app.request("/api/auth/request-password-reset", {
      body: JSON.stringify({
        email,
        redirectTo: "http://127.0.0.1:3000/reset-password",
      }),
      headers: {
        "content-type": "application/json",
        origin: "http://127.0.0.1:3000",
      },
      method: "POST",
    })

    expect(requestReset.status).toBe(200)

    const token = await extractResetToken(app, email)
    const resetResponse = await app.request("/api/auth/reset-password", {
      body: JSON.stringify({
        newPassword: "new-password1234",
        token,
      }),
      headers: {
        "content-type": "application/json",
        origin: "http://127.0.0.1:3000",
      },
      method: "POST",
    })

    expect(resetResponse.status).toBe(200)

    const oldPasswordSignIn = await signIn(app, {
      email,
      password: "password1234",
    })
    const newPasswordSignIn = await signIn(app, {
      email,
      password: "new-password1234",
    })

    expect(oldPasswordSignIn.status).toBeGreaterThanOrEqual(400)
    expect(newPasswordSignIn.status).toBe(200)
  })
})
