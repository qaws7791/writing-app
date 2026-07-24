import { createSign, generateKeyPairSync } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import { eq } from "drizzle-orm"

import { createInMemoryAuthEmailDelivery } from "#auth/email/in-memory"
import { createLearnerAuthRuntime } from "#auth/learner/server"
import {
  authAccounts,
  authRateLimits,
  authSessions,
  authUsers,
  authVerifications,
} from "#auth/schema/index"
import { createSqliteAuthDatabaseAdapter } from "#auth/sqlite-database"
import {
  createAuthTestDatabase,
  type AuthTestDatabase,
} from "#auth/test-support/auth-test-database"

const webOrigin = "http://localhost:3000"
const email = "learner@example.com"
const password = "Learner-password-123!"

describe("학습자 email/password 인증 통합", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

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
      expect(emailDelivery.readDeliveries()).toHaveLength(1)
      expect(emailDelivery.readDeliveries()[0]).toMatchObject({
        kind: "verification",
        recipientEmail: email,
      })

      const beforeVerification = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-in/email",
        {
          callbackURL: `${webOrigin}/app`,
          email,
          password,
        },
        "127.0.0.11"
      )
      expect(beforeVerification.status).toBe(403)
      await expect(beforeVerification.json()).resolves.toMatchObject({
        code: "EMAIL_NOT_VERIFIED",
      })

      const verificationUrl = emailDelivery.readDeliveries()[0]?.callbackUrl
      expect(verificationUrl).toBeDefined()
      if (verificationUrl === undefined) {
        throw new Error("확인 메일 URL이 기록되지 않았습니다.")
      }
      const verificationResponse = await runtime.authHandler(
        new Request(verificationUrl, {
          headers: { Origin: webOrigin },
          redirect: "manual",
        })
      )
      expect(verificationResponse.status).toBe(302)
      expect(verificationResponse.headers.get("location")).toBe(
        `${webOrigin}/login?verified=true`
      )

      const afterVerification = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-in/email",
        {
          callbackURL: `${webOrigin}/app`,
          email,
          password,
        },
        "127.0.0.11"
      )
      expect(afterVerification.status).toBe(200)
      const cookie = readSetCookiePair(afterVerification)
      expect(cookie).toContain("learner_session_token=")
      await expect(
        runtime.identityResolver.resolveIdentity(
          new Headers({ Cookie: cookie })
        )
      ).resolves.toMatchObject({
        email,
        name: "학습자",
      })
    } finally {
      database.close()
    }
  })

  it("확인 메일 재전송을 60초에 세 번으로 제한한다", async () => {
    const database = createAuthTestDatabase()
    const emailDelivery = createInMemoryAuthEmailDelivery()

    try {
      const runtime = createTestRuntime(database.db, emailDelivery)
      await postAuth(
        runtime.authHandler,
        "/api/auth/sign-up/email",
        {
          callbackURL: `${webOrigin}/login?verified=true`,
          email,
          name: "학습자",
          password,
        },
        "127.0.0.12"
      )

      const responses = []
      for (let attempt = 0; attempt < 4; attempt += 1) {
        responses.push(
          await postAuth(
            runtime.authHandler,
            "/api/auth/send-verification-email",
            {
              callbackURL: `${webOrigin}/login?verified=true`,
              email,
            },
            "127.0.0.12"
          )
        )
      }

      expect(responses.map((response) => response.status)).toEqual([
        200, 200, 200, 429,
      ])
      expect(responses[3]?.headers.get("x-retry-after")).not.toBeNull()
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
      const responses = []

      for (let attempt = 0; attempt < 4; attempt += 1) {
        responses.push(
          await postAuth(
            runtime.authHandler,
            "/api/auth/sign-in/email",
            {
              email: "missing@example.test",
              password,
            },
            "192.0.2.211"
          )
        )
      }

      expect(responses.map((response) => response.status)).toEqual([
        401, 401, 401, 429,
      ])

      const isolatedClientResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-in/email",
        {
          email: "missing@example.test",
          password,
        },
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
        {
          email: "weak@example.com",
          name: "학습자",
          password: "short",
        },
        "127.0.0.14"
      )
      expect(weakPasswordResponse.status).toBe(400)
      await expect(weakPasswordResponse.json()).resolves.toMatchObject({
        code: "PASSWORD_TOO_SHORT",
      })

      await postAuth(
        runtime.authHandler,
        "/api/auth/sign-up/email",
        {
          callbackURL: `${webOrigin}/login?verified=true`,
          email,
          name: "학습자",
          password,
        },
        "127.0.0.13"
      )
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

  it("재설정 응답을 동일하게 유지하고 token 만료·1회 사용·session 폐기를 강제한다", async () => {
    const database = createAuthTestDatabase()
    const emailDelivery = createInMemoryAuthEmailDelivery()

    try {
      const runtime = createTestRuntime(database.db, emailDelivery)
      await createVerifiedCredentialUser(runtime.authHandler, emailDelivery)
      const loginResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/sign-in/email",
        {
          callbackURL: `${webOrigin}/app`,
          email,
          password,
        },
        "127.0.0.31"
      )
      const sessionCookie = readSetCookiePair(loginResponse)

      const existingResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/request-password-reset",
        {
          email,
          redirectTo: `${webOrigin}/reset-password`,
        },
        "127.0.0.32"
      )
      const missingResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/request-password-reset",
        {
          email: "missing@example.com",
          redirectTo: `${webOrigin}/reset-password`,
        },
        "127.0.0.33"
      )

      expect(existingResponse.status).toBe(200)
      expect(missingResponse.status).toBe(200)
      await expect(existingResponse.json()).resolves.toEqual(
        await missingResponse.json()
      )
      const resetUrl = emailDelivery
        .readDeliveries()
        .find((delivery) => delivery.kind === "password-reset")?.callbackUrl
      expect(resetUrl).toBeDefined()
      if (resetUrl === undefined) {
        throw new Error("비밀번호 재설정 URL이 기록되지 않았습니다.")
      }

      const callbackResponse = await runtime.authHandler(
        new Request(resetUrl, {
          headers: { Origin: webOrigin },
          redirect: "manual",
        })
      )
      expect(callbackResponse.status).toBe(302)
      const resetToken = new URL(
        callbackResponse.headers.get("location") ?? webOrigin
      ).searchParams.get("token")
      expect(resetToken).not.toBeNull()
      if (resetToken === null) {
        throw new Error("비밀번호 재설정 token이 callback에 없습니다.")
      }

      const newPassword = "New-learner-password-123!"
      const resetResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/reset-password",
        { newPassword, token: resetToken },
        "127.0.0.34"
      )
      const reusedResponse = await postAuth(
        runtime.authHandler,
        "/api/auth/reset-password",
        { newPassword, token: resetToken },
        "127.0.0.35"
      )

      expect(resetResponse.status).toBe(200)
      expect(reusedResponse.status).toBe(400)
      await expect(reusedResponse.json()).resolves.toMatchObject({
        code: "INVALID_TOKEN",
      })
      await expect(
        runtime.identityResolver.resolveIdentity(
          new Headers({ Cookie: sessionCookie })
        )
      ).resolves.toBeNull()

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

      await postAuth(
        runtime.authHandler,
        "/api/auth/request-password-reset",
        { email, redirectTo: `${webOrigin}/reset-password` },
        "127.0.0.38"
      )
      const expiringResetUrl = emailDelivery
        .readDeliveries()
        .at(-1)?.callbackUrl
      expect(expiringResetUrl).toBeDefined()
      if (expiringResetUrl === undefined) {
        throw new Error("만료 검증용 재설정 URL이 기록되지 않았습니다.")
      }
      const expiringToken = new URL(expiringResetUrl).pathname.split("/").at(-1)
      expect(expiringToken).toBeDefined()
      if (expiringToken === undefined) {
        throw new Error("만료 검증용 token이 없습니다.")
      }
      database.db
        .update(authVerifications)
        .set({ expiresAt: new Date("2000-01-01T00:00:00.000Z") })
        .where(
          eq(authVerifications.identifier, `reset-password:${expiringToken}`)
        )
        .run()

      const expiredCallbackResponse = await runtime.authHandler(
        new Request(expiringResetUrl, {
          headers: { Origin: webOrigin },
          redirect: "manual",
        })
      )
      expect(expiredCallbackResponse.status).toBe(302)
      expect(
        new URL(
          expiredCallbackResponse.headers.get("location") ?? webOrigin
        ).searchParams.get("error")
      ).toBe("INVALID_TOKEN")
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
        setupDelivery
      )
      const failingRuntime = createTestRuntime(
        database.db,
        createInMemoryAuthEmailDelivery({ failureCode: "provider-rejected" })
      )

      const existingResponse = await postAuth(
        failingRuntime.authHandler,
        "/api/auth/request-password-reset",
        { email, redirectTo: `${webOrigin}/reset-password` },
        "127.0.0.41"
      )
      const missingResponse = await postAuth(
        failingRuntime.authHandler,
        "/api/auth/request-password-reset",
        {
          email: "missing@example.com",
          redirectTo: `${webOrigin}/reset-password`,
        },
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
      await createVerifiedCredentialUser(runtime.authHandler, emailDelivery)
      const existingUser = database.db.select().from(authUsers).get()
      expect(existingUser).toBeDefined()
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

  it("test 전용 sign-in route를 runtime에 등록하지 않는다", async () => {
    const database = createAuthTestDatabase()

    try {
      const runtime = createTestRuntime(
        database.db,
        createInMemoryAuthEmailDelivery()
      )
      const response = await runtime.authHandler(
        new Request(`${webOrigin}/api/auth/test/sign-in`)
      )

      expect(response.status).toBe(404)
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
    database: createSqliteAuthDatabaseAdapter({
      database,
      schema: {
        account: authAccounts,
        rateLimit: authRateLimits,
        session: authSessions,
        user: authUsers,
        verification: authVerifications,
      },
    }),
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

async function createVerifiedCredentialUser(
  authHandler: (request: Request) => Promise<Response>,
  emailDelivery: ReturnType<typeof createInMemoryAuthEmailDelivery>
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
    "127.0.0.21"
  )
  expect(signUpResponse.status).toBe(200)

  const verificationUrl = emailDelivery
    .readDeliveries()
    .find((delivery) => delivery.kind === "verification")?.callbackUrl
  expect(verificationUrl).toBeDefined()
  if (verificationUrl === undefined) {
    throw new Error("확인 메일 URL이 기록되지 않았습니다.")
  }

  const verificationResponse = await authHandler(
    new Request(verificationUrl, {
      headers: { Origin: webOrigin },
      redirect: "manual",
    })
  )
  expect(verificationResponse.status).toBe(302)
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

function readSetCookiePair(response: Response): string {
  return (response.headers.get("set-cookie") ?? "")
    .split(/,(?=\s*[^;,]+=)/u)
    .map((value) => value.trim().split(";")[0])
    .filter(Boolean)
    .join("; ")
}
