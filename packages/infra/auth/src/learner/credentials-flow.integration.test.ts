import { createSign, generateKeyPairSync } from "node:crypto"
import { describe, expect, it, vi } from "vitest"

import { createInMemoryAuthEmailDelivery } from "#auth/email/in-memory"
import { createLearnerAuthRuntime } from "#auth/learner/server"
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
} from "#auth/schema/index"
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
const expiredAt = new Date("2000-01-01T00:00:00.000Z")

describe("학습자 email/password 인증 통합", () => {
  it("가입, 확인 전 차단, 이메일 확인, 로그인 순서를 강제한다", async () => {
    const database = createAuthTestDatabase()
    const emailDelivery = createInMemoryAuthEmailDelivery()

    try {
      const runtime = createTestRuntime(database.db, emailDelivery)
      const signUpResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-up/email",
        {
          callbackURL: `${webOrigin}/login?verified=true`,
          email,
          name: "학습자",
          password,
        },
        "127.0.0.11"
      )

      expect(signUpResponse.status).toBe(200)
      expect(signUpResponse.headers.get("set-cookie")).toBeNull()
      expect(emailDelivery.readDeliveries()).toMatchObject([
        { kind: "verification", recipientEmail: email },
      ])

      const beforeVerification = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-in/email",
        { callbackURL: `${webOrigin}/app`, email, password },
        "127.0.0.11"
      )
      expect(beforeVerification.status).toBe(403)
      await expect(beforeVerification.json()).resolves.toMatchObject({
        code: "EMAIL_NOT_VERIFIED",
      })

      const verificationResponse = await followCallback(
        runtime.authHandler,
        readVerificationUrl(emailDelivery)
      )
      expect(verificationResponse.status).toBe(302)
      expect(verificationResponse.headers.get("location")).toBe(
        `${webOrigin}/login?verified=true`
      )

      const afterVerification = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-in/email",
        { callbackURL: `${webOrigin}/app`, email, password },
        "127.0.0.11"
      )
      expect(afterVerification.status).toBe(200)
      const cookie = readSetCookiePair(afterVerification)
      expect(cookie).toContain("learner_session_token=")
      await expect(
        runtime.identityResolver.resolveIdentity(
          new Headers({ Cookie: cookie })
        )
      ).resolves.toMatchObject({ email, name: "학습자" })
    } finally {
      database.close()
    }
  })

  it("사용한 이메일 확인 링크로는 새 session을 만들지 않는다", async () => {
    const database = createAuthTestDatabase()
    const emailDelivery = createInMemoryAuthEmailDelivery()

    try {
      const runtime = createTestRuntime(database.db, emailDelivery)
      await signUp(runtime.authHandler, "127.0.0.61")
      const verificationUrl = readVerificationUrl(emailDelivery)
      await followCallback(runtime.authHandler, verificationUrl)

      const reusedResponse = await followCallback(
        runtime.authHandler,
        verificationUrl
      )

      expect(reusedResponse.headers.get("set-cookie")).toBeNull()
    } finally {
      database.close()
    }
  })

  it("확인 메일 재전송을 60초에 세 번으로 제한한다", async () => {
    const database = createAuthTestDatabase()
    const emailDelivery = createInMemoryAuthEmailDelivery()

    try {
      const runtime = createTestRuntime(database.db, emailDelivery)
      await signUp(runtime.authHandler, "127.0.0.12")

      const responses = await sendSequentially(4, async () =>
        postAuth(
          runtime.authHandler,
          "/api/auth/send-verification-email",
          { callbackURL: `${webOrigin}/login?verified=true`, email },
          "127.0.0.12"
        )
      )

      expect(responses.map((response) => response.status)).toEqual([
        200, 200, 200, 429,
      ])
      expect(
        Number(responses.at(-1)?.headers.get("x-retry-after"))
      ).toBeGreaterThan(0)
      expect(emailDelivery.readDeliveries()).toHaveLength(4)
    } finally {
      database.close()
    }
  })

  it("로그인 제한을 trusted client IP별 독립 버킷으로 적용한다", async () => {
    const database = createAuthTestDatabase()

    try {
      const runtime = createTestRuntime(
        database.db,
        createInMemoryAuthEmailDelivery()
      )

      const responses = await sendSequentially(4, async () =>
        postAuth(
          runtime.authHandler,
          "/api/auth/sign-in/email",
          { email: "missing@example.test", password },
          "192.0.2.211"
        )
      )

      expect(responses.map((response) => response.status)).toEqual([
        401, 401, 401, 429,
      ])

      const isolatedClientResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-in/email",
        { email: "missing@example.test", password },
        "192.0.2.212"
      )
      expect(isolatedClientResponse.status).toBe(401)
    } finally {
      database.close()
    }
  })

  it("약한 비밀번호 오류를 고정하고 중복 가입은 계정 존재를 노출하지 않는다", async () => {
    const database = createAuthTestDatabase()
    const emailDelivery = createInMemoryAuthEmailDelivery()

    try {
      const runtime = createTestRuntime(database.db, emailDelivery)
      const weakPasswordResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-up/email",
        { email: "weak@example.com", name: "학습자", password: "short" },
        "127.0.0.14"
      )
      expect(weakPasswordResponse.status).toBe(400)
      await expect(weakPasswordResponse.json()).resolves.toMatchObject({
        code: "PASSWORD_TOO_SHORT",
      })

      await signUp(runtime.authHandler, "127.0.0.13")
      const duplicateResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-up/email",
        {
          callbackURL: `${webOrigin}/login?verified=true`,
          email,
          name: "다른 이름",
          password,
        },
        "127.0.0.13"
      )

      expect(duplicateResponse.status).toBe(200)
      await expect(duplicateResponse.json()).resolves.toMatchObject({
        token: null,
      })
      expect(emailDelivery.readDeliveries()).toHaveLength(1)
    } finally {
      database.close()
    }
  })

  it("재설정 요청 응답은 계정 존재 여부와 무관하게 같다", async () => {
    const database = createAuthTestDatabase()
    const emailDelivery = createInMemoryAuthEmailDelivery()

    try {
      const runtime = createTestRuntime(database.db, emailDelivery)
      await createVerifiedCredentialUser(
        runtime.authHandler,
        emailDelivery,
        "127.0.0.71"
      )

      const existingResponse = await requestPasswordReset(
        runtime.authHandler,
        email,
        "127.0.0.32"
      )
      const missingResponse = await requestPasswordReset(
        runtime.authHandler,
        "missing@example.com",
        "127.0.0.33"
      )

      expect(existingResponse.status).toBe(200)
      expect(missingResponse.status).toBe(200)
      await expect(existingResponse.json()).resolves.toEqual(
        await missingResponse.json()
      )
    } finally {
      database.close()
    }
  })

  it("reset token은 한 번만 사용할 수 있다", async () => {
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

  it("비밀번호 재설정은 기존 session을 폐기한다", async () => {
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

      await resetPassword(runtime.authHandler, resetToken, "127.0.0.34")

      await expect(
        runtime.identityResolver.resolveIdentity(
          new Headers({ Cookie: sessionCookie })
        )
      ).resolves.toBeNull()
    } finally {
      database.close()
    }
  })

  it("재설정 후 이전 비밀번호는 거부하고 새 비밀번호만 허용한다", async () => {
    const database = createAuthTestDatabase()
    const emailDelivery = createInMemoryAuthEmailDelivery()

    try {
      const runtime = createTestRuntime(database.db, emailDelivery)
      await createVerifiedCredentialUser(
        runtime.authHandler,
        emailDelivery,
        "127.0.0.74"
      )
      const resetToken = await issueResetToken(
        runtime.authHandler,
        emailDelivery,
        "127.0.0.84"
      )
      await resetPassword(runtime.authHandler, resetToken, "127.0.0.34")

      const oldPasswordResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-in/email",
        { email, password },
        "127.0.0.36"
      )
      const newPasswordResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-in/email",
        { email, password: newPassword },
        "127.0.0.37"
      )

      expect(oldPasswordResponse.status).toBe(401)
      expect(newPasswordResponse.status).toBe(200)
    } finally {
      database.close()
    }
  })

  it("만료된 reset token은 재설정 화면으로 진입시키지 않는다", async () => {
    const database = createAuthTestDatabase()
    const emailDelivery = createInMemoryAuthEmailDelivery()

    try {
      const runtime = createTestRuntime(database.db, emailDelivery)
      await createVerifiedCredentialUser(
        runtime.authHandler,
        emailDelivery,
        "127.0.0.75"
      )
      await requestPasswordReset(runtime.authHandler, email, "127.0.0.38")
      const resetUrl = readResetUrl(emailDelivery)
      expireAllVerifications(database.db, 1)

      const expiredCallbackResponse = await followCallback(
        runtime.authHandler,
        resetUrl
      )

      expect(expiredCallbackResponse.status).toBe(302)
      expect(
        readCallbackLocation(expiredCallbackResponse).searchParams.get("error")
      ).toBe("INVALID_TOKEN")
    } finally {
      database.close()
    }
  })

  it("만료된 session cookie는 보호 API identity로 인정하지 않는다", async () => {
    const database = createAuthTestDatabase()
    const emailDelivery = createInMemoryAuthEmailDelivery()

    try {
      const runtime = createTestRuntime(database.db, emailDelivery)
      await createVerifiedCredentialUser(
        runtime.authHandler,
        emailDelivery,
        "127.0.0.78"
      )
      const loginResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-in/email",
        { callbackURL: `${webOrigin}/app`, email, password },
        "127.0.0.78"
      )
      const sessionCookie = readSetCookiePair(loginResponse)
      const expiredSessions = database.db
        .update(authSessions)
        .set({ expiresAt: expiredAt })
        .returning({ id: authSessions.id })
        .all()

      expect(expiredSessions).toHaveLength(1)
      await expect(
        runtime.identityResolver.resolveIdentity(
          new Headers({ Cookie: sessionCookie })
        )
      ).resolves.toBeNull()
    } finally {
      database.close()
    }
  })

  it("메일 provider 실패 여부와 무관하게 재설정 요청에서 계정 존재를 숨긴다", async () => {
    const database = createAuthTestDatabase()
    const setupDelivery = createInMemoryAuthEmailDelivery()

    try {
      const setupRuntime = createTestRuntime(database.db, setupDelivery)
      await createVerifiedCredentialUser(
        setupRuntime.authHandler,
        setupDelivery,
        "127.0.0.76"
      )
      const failingRuntime = createTestRuntime(
        database.db,
        createInMemoryAuthEmailDelivery({ failureCode: "provider-rejected" })
      )

      const existingResponse = await requestPasswordReset(
        failingRuntime.authHandler,
        email,
        "127.0.0.41"
      )
      const missingResponse = await requestPasswordReset(
        failingRuntime.authHandler,
        "missing@example.com",
        "127.0.0.42"
      )

      expect(existingResponse.status).toBe(200)
      expect(missingResponse.status).toBe(200)
      await expect(existingResponse.json()).resolves.toEqual(
        await missingResponse.json()
      )
    } finally {
      database.close()
    }
  })

  it("검증된 동일 이메일 Google 로그인은 기존 user에 account만 연결한다", async () => {
    const database = createAuthTestDatabase()
    const emailDelivery = createInMemoryAuthEmailDelivery()
    const identityProvisioner = { provision: vi.fn(async () => undefined) }

    try {
      const runtime = createTestRuntime(database.db, emailDelivery, {
        google: true,
        identityProvisioner,
      })
      await createVerifiedCredentialUser(
        runtime.authHandler,
        emailDelivery,
        "127.0.0.77"
      )
      const existingUser = database.db.select().from(authUsers).get()
      if (existingUser === undefined) {
        throw new Error("기존 credential user가 없습니다.")
      }

      const googleToken = createSignedGoogleIdToken({
        audience: "google-test-client",
        email,
      })
      vi.stubGlobal(
        "fetch",
        vi.fn(async (request: RequestInfo | URL) => {
          const url =
            request instanceof Request ? request.url : request.toString()
          if (url !== "https://www.googleapis.com/oauth2/v3/certs") {
            throw new Error(`예상하지 않은 OAuth 요청입니다: ${url}`)
          }
          return Response.json({
            keys: [
              {
                ...googleToken.publicJwk,
                alg: "RS256",
                kid: googleToken.keyId,
                use: "sig",
              },
            ],
          })
        })
      )

      const googleResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-in/social",
        {
          callbackURL: `${webOrigin}/app`,
          idToken: { token: googleToken.token },
          provider: "google",
        },
        "127.0.0.51"
      )

      expect(googleResponse.status).toBe(200)
      expect(database.db.select().from(authUsers).all()).toHaveLength(1)
      expect(
        database.db
          .select({
            providerId: authAccounts.providerId,
            userId: authAccounts.userId,
          })
          .from(authAccounts)
          .all()
      ).toEqual(
        expect.arrayContaining([
          { providerId: "credential", userId: existingUser.id },
          { providerId: "google", userId: existingUser.id },
        ])
      )
      expect(identityProvisioner.provision).toHaveBeenCalledOnce()
    } finally {
      database.close()
    }
  })
})

function createTestRuntime(
  database: AuthTestDatabase,
  emailDelivery: ReturnType<typeof createInMemoryAuthEmailDelivery>,
  options: {
    readonly google?: boolean
    readonly identityProvisioner?: {
      readonly provision: (identity: {
        readonly email: string
        readonly id: string
        readonly image: string | null
        readonly joinedAt: Date
        readonly name: string
      }) => Promise<void>
    }
  } = {}
) {
  return createLearnerAuthRuntime({
    database: createLearnerAuthDatabaseAdapter(database),
    emailDelivery,
    ...(options.google === true
      ? {
          googleClientId: "google-test-client",
          googleClientSecret: "google-test-secret",
        }
      : {}),
    identityProvisioner: options.identityProvisioner ?? {
      async provision() {},
    },
    secret: "learner-test-secret-0123456789abcdef",
    webOrigin,
  })
}

async function sendSequentially(
  attempts: number,
  send: () => Promise<Response>
): Promise<readonly Response[]> {
  const responses: Response[] = []

  for (const _attempt of Array.from({ length: attempts })) {
    responses.push(await send())
  }

  return responses
}

async function signUp(
  authHandler: (request: Request) => Promise<Response>,
  ipAddress = "127.0.0.11"
): Promise<void> {
  const response = await postAuth(
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

  if (response.status !== 200) {
    throw new Error(`가입 준비가 실패했습니다: ${response.status}`)
  }
}

async function createVerifiedCredentialUser(
  authHandler: (request: Request) => Promise<Response>,
  emailDelivery: ReturnType<typeof createInMemoryAuthEmailDelivery>,
  ipAddress: string
): Promise<void> {
  await signUp(authHandler, ipAddress)
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

async function requestPasswordReset(
  authHandler: (request: Request) => Promise<Response>,
  recipientEmail: string,
  ipAddress: string
): Promise<Response> {
  return postAuth(
    authHandler,
    "/api/auth/request-password-reset",
    { email: recipientEmail, redirectTo: `${webOrigin}/reset-password` },
    ipAddress
  )
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

async function issueResetToken(
  authHandler: (request: Request) => Promise<Response>,
  emailDelivery: ReturnType<typeof createInMemoryAuthEmailDelivery>,
  ipAddress: string
): Promise<string> {
  await requestPasswordReset(authHandler, email, ipAddress)
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

function expireAllVerifications(
  database: AuthTestDatabase,
  expectedRows: number
): void {
  const expired = database
    .update(authVerifications)
    .set({ expiresAt: expiredAt })
    .returning({ id: authVerifications.id })
    .all()

  if (expired.length !== expectedRows) {
    throw new Error(
      `만료 처리한 verification row 수가 다릅니다: ${expired.length}`
    )
  }
}

function createSignedGoogleIdToken(input: {
  readonly audience: string
  readonly email: string
}): Readonly<{
  keyId: string
  publicJwk: JsonWebKey
  token: string
}> {
  const keyId = "google-test-key"
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  })
  const issuedAt = Math.floor(Date.now() / 1000)
  const encodedHeader = encodeJwtPart({
    alg: "RS256",
    kid: keyId,
    typ: "JWT",
  })
  const encodedPayload = encodeJwtPart({
    aud: input.audience,
    email: input.email,
    email_verified: true,
    exp: issuedAt + 3600,
    iat: issuedAt,
    iss: "https://accounts.google.com",
    name: "Google 학습자",
    picture: "https://example.test/avatar.png",
    sub: "google-account-1",
  })
  const unsignedToken = `${encodedHeader}.${encodedPayload}`
  const signature = createSign("RSA-SHA256")
    .update(unsignedToken)
    .end()
    .sign(privateKey)
    .toString("base64url")

  return {
    keyId,
    publicJwk: publicKey.export({ format: "jwk" }),
    token: `${unsignedToken}.${signature}`,
  }
}

function encodeJwtPart(value: Readonly<object>): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url")
}

async function postAuth(
  authHandler: (request: Request) => Promise<Response>,
  path: string,
  body: Readonly<object>,
  ipAddress = "127.0.0.1"
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
