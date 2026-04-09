import { afterEach, describe, expect, test } from "vitest"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { okAsync, errAsync } from "neverthrow"
import { cors } from "hono/cors"
import type { OpenAPIHono } from "@hono/zod-openapi"

import {
  toJourneyId,
  toPromptId,
  toSessionId,
  toStepId,
  toWritingId,
  journeyNotFound,
} from "@workspace/core"

import {
  createUseCaseMiddleware,
  createTimeoutMiddleware,
  handleRequestError,
} from "../app.js"
import { createApp } from "../lib/hono/create-app.js"
import { createRequestLoggerMiddleware } from "../middleware/request-logger.js"
import { createResolveSessionMiddleware } from "../middleware/resolve-session.js"
import { createDevEmailInbox, createDevEmailPort } from "./auth-email.js"
import { createSilentLogger } from "../observability/logger.js"
import { allRoutes } from "../routes/index.js"
import getAuthEmails from "../routes/dev/get-auth-emails.js"
import type { AppEnv } from "../app-env.js"

type TestApp = OpenAPIHono<AppEnv>

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

  const logger = createSilentLogger()

  const stubWriting = {
    id: toWritingId(1),
    title: "",
    preview: "",
    wordCount: 0,
    sourcePromptId: null,
    createdAt: "2026-03-20T00:00:00.000Z",
    updatedAt: "2026-03-20T00:00:00.000Z",
    bodyJson: null,
    bodyPlainText: "",
  }

  const stubPrompt = {
    id: toPromptId(1),
    promptType: "reflection" as const,
    title: "테스트 글감",
    body: "테스트 내용",
    thumbnailUrl: "",
    responseCount: 0,
    isBookmarked: false,
  }

  const stubSessionRuntime = {
    id: toSessionId(1),
    journeyId: toJourneyId(1),
    order: 1,
    title: "테스트 세션",
    description: "테스트용 세션 설명",
    estimatedMinutes: 10,
    steps: [
      {
        id: toStepId(1),
        sessionId: toSessionId(1),
        order: 1,
        type: "write" as const,
        contentJson: {
          cta: { label: "다음", variant: "primary" as const },
          content: {
            type: "WRITING" as const,
            guideline: "테스트 가이드",
            minLength: 1,
            prompt: "테스트 글을 작성해 주세요.",
            recommendedLength: 10,
            timeLimitSeconds: 0,
          },
          type: "WRITING" as const,
        },
      },
    ],
    currentStepOrder: 1,
    status: "in_progress" as const,
    stepResponsesJson: {},
    stepAiStates: [],
  }

  const app = createApp<AppEnv>({
    globalMiddleware: [
      cors({
        allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        origin: (origin) => {
          if (!origin) return null
          return origin === "http://127.0.0.1:3000" ? origin : null
        },
      }),
      createRequestLoggerMiddleware(logger),
      createResolveSessionMiddleware((request) =>
        auth.api.getSession({ headers: request.headers })
      ),
      createUseCaseMiddleware({
        authHandler: auth.handler,
        autosaveWritingUseCase(_userId, _writingId, _input) {
          return okAsync(stubWriting)
        },
        bookmarkPromptUseCase() {
          return okAsync({
            kind: "bookmarked" as const,
            savedAt: "2026-03-20T00:00:00.000Z",
          })
        },
        compareRevisionsUseCase() {
          return okAsync({ improvements: [], summary: "" })
        },
        completeSessionUseCase() {
          return okAsync(undefined as void)
        },
        createWritingUseCase() {
          return okAsync(stubWriting)
        },
        deleteWritingUseCase() {
          return okAsync(undefined as void)
        },
        enrollJourneyUseCase() {
          return okAsync({
            userId: "user-1" as unknown as ReturnType<
              typeof import("@workspace/core").toUserId
            >,
            journeyId: toJourneyId(1),
            currentSessionOrder: 1,
            completionRate: 0,
            status: "in_progress" as const,
          })
        },
        generateFeedbackUseCase() {
          return okAsync({ strengths: [], improvements: [], question: "" })
        },
        getHomeUseCase() {
          return okAsync({
            dailyPrompt: null,
            activeJourneys: [],
            completedJourneys: [],
          })
        },
        getJourneyUseCase() {
          return errAsync(journeyNotFound("여정을 찾을 수 없습니다."))
        },
        getPromptUseCase() {
          return okAsync(stubPrompt)
        },
        getSessionDetailUseCase() {
          return okAsync(stubSessionRuntime)
        },
        getWritingUseCase() {
          return okAsync(stubWriting)
        },
        listJourneysUseCase() {
          return okAsync([])
        },
        listCompletedJourneysUseCase() {
          return okAsync([])
        },
        listUserJourneysUseCase() {
          return okAsync([])
        },
        listPromptWritingsUseCase() {
          return okAsync({ items: [], nextCursor: null, hasMore: false })
        },
        listPromptsUseCase() {
          return okAsync({ items: [], nextCursor: null })
        },
        listWritingsUseCase() {
          return okAsync({ items: [], nextCursor: null })
        },
        readLatestAuthEmail: inbox.readLatestMessage,
        sqliteVersion: "memory",
        startSessionUseCase() {
          return okAsync(stubSessionRuntime)
        },
        submitStepUseCase() {
          return okAsync({
            acceptedAi: false,
            runtime: stubSessionRuntime,
          })
        },
        retrySessionStepAiUseCase() {
          return okAsync(stubSessionRuntime)
        },
        unbookmarkPromptUseCase() {
          return okAsync(undefined as void)
        },
      }),
      createTimeoutMiddleware(),
    ],
    errorHandler: (error, c) => {
      if (error instanceof Error && error.name === "TimeoutError") {
        return c.json(
          { error: { code: "request_timeout", message: error.message } },
          408
        )
      }
      return handleRequestError(c, error, logger, "request failed")
    },
    routes: [...allRoutes, getAuthEmails],
    notFound: (c) =>
      c.json(
        {
          error: {
            code: "not_found",
            message: "요청한 경로를 찾을 수 없습니다.",
          },
        },
        404
      ),
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

  test("supports password reset flow", async () => {
    const { app } = setup()
    const email = createEmailAddress("pwd-reset")

    await signUp(app, email)
    await verifyEmail(app, email)

    const requestResetResponse = await app.request(
      "/api/auth/request-password-reset",
      {
        body: JSON.stringify({
          email,
          redirectTo: "http://127.0.0.1:3000/reset-password",
        }),
        headers: {
          "content-type": "application/json",
          origin: "http://127.0.0.1:3000",
        },
        method: "POST",
      }
    )

    expect(requestResetResponse.ok).toBeTruthy()

    const resetToken = await extractResetToken(app, email)

    const resetPasswordResponse = await app.request(
      "/api/auth/reset-password",
      {
        body: JSON.stringify({
          newPassword: "newpassword1234",
          token: resetToken,
        }),
        headers: {
          "content-type": "application/json",
          origin: "http://127.0.0.1:3000",
        },
        method: "POST",
      }
    )

    expect(resetPasswordResponse.ok).toBeTruthy()

    const signInWithOldPassword = await signIn(app, {
      email,
      password: "password1234",
    })
    const signInWithNewPassword = await signIn(app, {
      email,
      password: "newpassword1234",
    })

    expect(signInWithOldPassword.status).toBeGreaterThanOrEqual(400)
    expect(signInWithNewPassword.status).toBe(200)
  })
})
