import { describe, expect, it } from "vitest"

import { createInMemoryAuthEmailDelivery } from "#auth/email/in-memory"
import { createLearnerAuthRuntime } from "#auth/learner/server"
import {
  createAuthTestDatabase,
  createLearnerAuthDatabaseAdapter,
  readSetCookiePair,
  type AuthTestDatabase,
} from "#auth/test-support/auth-test-database"

const webOrigin = "http://localhost:3000"
const email = "learner@example.com"
const password = "Learner-password-123!"
const newPassword = "New-learner-password-123!"

describe("learner credential recovery", () => {
  it("accepts a reset token only once", async () => {
    const database = createAuthTestDatabase()
    const emailDelivery = createInMemoryAuthEmailDelivery()

    try {
      const runtime = createTestRuntime(database.db, emailDelivery)
      await createVerifiedCredentialUser(
        runtime.authHandler,
        emailDelivery,
        "127.0.0.72"
      )
      const resetToken = await issueResetToken(
        runtime.authHandler,
        emailDelivery,
        "127.0.0.82"
      )

      const resetResponse = await resetPassword(
        runtime.authHandler,
        resetToken,
        "127.0.0.34"
      )
      const reusedResponse = await resetPassword(
        runtime.authHandler,
        resetToken,
        "127.0.0.35"
      )

      expect(resetResponse.status).toBe(200)
      expect(reusedResponse.status).toBe(400)
      await expect(reusedResponse.json()).resolves.toMatchObject({
        code: "INVALID_TOKEN",
      })
    } finally {
      database.close()
    }
  })

  it("revokes an existing session after the password is reset", async () => {
    const database = createAuthTestDatabase()
    const emailDelivery = createInMemoryAuthEmailDelivery()

    try {
      const runtime = createTestRuntime(database.db, emailDelivery)
      await createVerifiedCredentialUser(
        runtime.authHandler,
        emailDelivery,
        "127.0.0.73"
      )
      const loginResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-in/email",
        { callbackURL: `${webOrigin}/app`, email, password },
        "127.0.0.31"
      )
      const sessionCookie = readSetCookiePair(loginResponse)
      const resetToken = await issueResetToken(
        runtime.authHandler,
        emailDelivery,
        "127.0.0.83"
      )

      const resetResponse = await resetPassword(
        runtime.authHandler,
        resetToken,
        "127.0.0.34"
      )

      expect(resetResponse.status).toBe(200)
      await expect(
        runtime.identityResolver.resolveIdentity(
          new Headers({ Cookie: sessionCookie })
        )
      ).resolves.toBeNull()
    } finally {
      database.close()
    }
  })
})

function createTestRuntime(
  database: AuthTestDatabase,
  emailDelivery: ReturnType<typeof createInMemoryAuthEmailDelivery>
) {
  return createLearnerAuthRuntime({
    database: createLearnerAuthDatabaseAdapter(database),
    emailDelivery,
    identityProvisioner: { async provision() {} },
    secret: "learner-test-secret-0123456789abcdef",
    webOrigin,
  })
}

async function createVerifiedCredentialUser(
  authHandler: (request: Request) => Promise<Response>,
  emailDelivery: ReturnType<typeof createInMemoryAuthEmailDelivery>,
  ipAddress: string
): Promise<void> {
  const signUpResponse = await postAuth(
    authHandler,
    "/api/auth/sign-up/email",
    {
      callbackURL: `${webOrigin}/login?verified=true`,
      email,
      name: "학습자",
      password,
    },
    ipAddress
  )
  if (signUpResponse.status !== 200) {
    throw new Error(`가입 준비가 실패했습니다: ${signUpResponse.status}`)
  }

  const verificationResponse = await followCallback(
    authHandler,
    readVerificationUrl(emailDelivery)
  )
  if (verificationResponse.status !== 302) {
    throw new Error(
      `이메일 확인 준비가 실패했습니다: ${verificationResponse.status}`
    )
  }
}

async function issueResetToken(
  authHandler: (request: Request) => Promise<Response>,
  emailDelivery: ReturnType<typeof createInMemoryAuthEmailDelivery>,
  ipAddress: string
): Promise<string> {
  await postAuth(
    authHandler,
    "/api/auth/request-password-reset",
    { email, redirectTo: `${webOrigin}/reset-password` },
    ipAddress
  )
  const callbackResponse = await followCallback(
    authHandler,
    readResetUrl(emailDelivery)
  )
  const token = readCallbackLocation(callbackResponse).searchParams.get("token")

  if (token === null) {
    throw new Error("비밀번호 재설정 token이 callback에 없습니다.")
  }
  return token
}

async function resetPassword(
  authHandler: (request: Request) => Promise<Response>,
  token: string,
  ipAddress: string
): Promise<Response> {
  return postAuth(
    authHandler,
    "/api/auth/reset-password",
    { newPassword, token },
    ipAddress
  )
}

function readVerificationUrl(
  emailDelivery: ReturnType<typeof createInMemoryAuthEmailDelivery>
): string {
  const url = emailDelivery
    .readDeliveries()
    .find((delivery) => delivery.kind === "verification")?.callbackUrl

  if (url === undefined) {
    throw new Error("확인 메일 URL이 기록되지 않았습니다.")
  }
  return url
}

function readResetUrl(
  emailDelivery: ReturnType<typeof createInMemoryAuthEmailDelivery>
): string {
  const url = [...emailDelivery.readDeliveries()]
    .reverse()
    .find((delivery) => delivery.kind === "password-reset")?.callbackUrl

  if (url === undefined) {
    throw new Error("비밀번호 재설정 URL이 기록되지 않았습니다.")
  }
  return url
}

async function followCallback(
  authHandler: (request: Request) => Promise<Response>,
  callbackUrl: string
): Promise<Response> {
  return authHandler(
    new Request(callbackUrl, {
      headers: { Origin: webOrigin },
      redirect: "manual",
    })
  )
}

function readCallbackLocation(response: Response): URL {
  const location = response.headers.get("location")

  if (location === null) {
    throw new Error("callback 응답에 redirect location이 없습니다.")
  }
  return new URL(location)
}

async function postAuth(
  authHandler: (request: Request) => Promise<Response>,
  path: string,
  body: Readonly<object>,
  ipAddress: string
): Promise<Response> {
  return authHandler(
    new Request(`${webOrigin}${path}`, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Origin: webOrigin,
        "X-Writing-App-Client-IP": ipAddress,
      },
      method: "POST",
    })
  )
}
