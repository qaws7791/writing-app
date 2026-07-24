import { beforeEach, describe, expect, it, vi } from "vitest"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import {
  authAccounts,
  authRateLimits,
  authSessions,
  authUsers,
  authVerifications,
} from "#auth/schema/index"

import { createLearnerAuthRuntime } from "#auth/learner/server"
import { createInMemoryAuthEmailDelivery } from "#auth/email/in-memory"
import { createSqliteAuthDatabaseAdapter } from "#auth/sqlite-database"
import {
  createAuthTestDatabase,
  type AuthTestDatabase,
} from "#auth/test-support/auth-test-database"

const authMocks = vi.hoisted(() => ({
  betterAuth: vi.fn(),
  getSession: vi.fn(),
  handler: vi.fn(async () => new Response(null)),
}))

vi.mock("better-auth", () => ({
  betterAuth: authMocks.betterAuth,
}))

const now = new Date("2026-06-15T09:00:00.000Z")
const sessionUser = {
  createdAt: now,
  email: "learner@example.com",
  emailVerified: true,
  id: "user-1",
  image: null,
  name: "학습자",
}

describe("학습자 Better Auth runtime", () => {
  beforeEach(() => {
    authMocks.betterAuth.mockReset()
    authMocks.getSession.mockReset()
    authMocks.handler.mockClear()
    authMocks.betterAuth.mockReturnValue({
      api: { getSession: authMocks.getSession },
      handler: authMocks.handler,
    })
  })

  it("학습자 URL, origin, cookie, Google provider와 계정 연결 정책을 보존한다", () => {
    const database = createAuthTestDatabase()

    try {
      createLearnerAuthRuntime({
        database: createTestDatabaseAdapter(database.db),
        emailDelivery: createInMemoryAuthEmailDelivery(),
        googleClientId: "google-client",
        googleClientSecret: "google-secret",
        identityProvisioner: createTestIdentityProvisioner(),
        secret: "learner-secret-0123456789abcdef",
        webOrigin: "https://app.example.test",
      })

      expect(authMocks.betterAuth.mock.calls.at(0)?.at(0)).toMatchObject({
        account: {
          accountLinking: {
            allowDifferentEmails: false,
            disableImplicitLinking: false,
            enabled: true,
            requireLocalEmailVerified: true,
            updateUserInfoOnLink: false,
          },
        },
        advanced: {
          cookies: {
            session_token: { name: learnerSessionCookieName },
          },
          ipAddress: {
            ipAddressHeaders: ["x-writing-app-client-ip"],
          },
        },
        basePath: "/api/auth",
        baseURL: "https://app.example.test",
        emailAndPassword: {
          enabled: true,
          maxPasswordLength: 128,
          minPasswordLength: 12,
          requireEmailVerification: true,
          resetPasswordTokenExpiresIn: 3600,
          revokeSessionsOnPasswordReset: true,
        },
        emailVerification: {
          autoSignInAfterVerification: false,
          sendOnSignIn: false,
          sendOnSignUp: true,
        },
        rateLimit: {
          customRules: {
            "/send-verification-email": {
              max: 3,
              window: 60,
            },
          },
          enabled: true,
          storage: "memory",
        },
        socialProviders: {
          google: {
            clientId: "google-client",
            clientSecret: "google-secret",
            scope: ["openid", "email", "profile"],
          },
        },
        trustedOrigins: ["https://app.example.test"],
      })
    } finally {
      database.close()
    }
  })

  it("Better Auth 사용자 생성 hook을 프로필 저장소에 연결한다", async () => {
    const database = createAuthTestDatabase()
    const identityProvisioner = createTestIdentityProvisioner()

    try {
      createLearnerAuthRuntime({
        database: createTestDatabaseAdapter(database.db),
        emailDelivery: createInMemoryAuthEmailDelivery(),
        identityProvisioner,
        secret: "x".repeat(32),
        webOrigin: "https://app.example.test",
      })
      const authConfig = authMocks.betterAuth.mock.calls.at(0)?.at(0) as
        | LearnerAuthHookConfig
        | undefined

      await authConfig?.databaseHooks.user.create.after(sessionUser)

      expect(identityProvisioner.provision).toHaveBeenCalledWith({
        email: "learner@example.com",
        id: "user-1",
        image: null,
        joinedAt: now,
        name: "학습자",
      })
    } finally {
      database.close()
    }
  })

  it("Better Auth session을 학습자 session으로 변환한다", async () => {
    const database = createAuthTestDatabase()
    authMocks.getSession.mockResolvedValue({ user: sessionUser })

    try {
      const runtime = createLearnerAuthRuntime({
        database: createTestDatabaseAdapter(database.db),
        emailDelivery: createInMemoryAuthEmailDelivery(),
        identityProvisioner: createTestIdentityProvisioner(),
        secret: "x".repeat(32),
        webOrigin: "https://app.example.test",
      })

      await expect(
        runtime.identityResolver.resolveIdentity(new Headers())
      ).resolves.toEqual({
        email: "learner@example.com",
        id: "user-1",
        image: null,
        joinedAt: now,
        name: "학습자",
      })
    } finally {
      database.close()
    }
  })

  it("Better Auth session 누락을 인증 identity 부재로 반환한다", async () => {
    const database = createAuthTestDatabase()

    try {
      const runtime = createLearnerAuthRuntime({
        database: createTestDatabaseAdapter(database.db),
        emailDelivery: createInMemoryAuthEmailDelivery(),
        identityProvisioner: createTestIdentityProvisioner(),
        secret: "x".repeat(32),
        webOrigin: "https://app.example.test",
      })
      authMocks.getSession.mockResolvedValueOnce(null)
      await expect(
        runtime.identityResolver.resolveIdentity(new Headers())
      ).resolves.toBeNull()
    } finally {
      database.close()
    }
  })

  it("이메일 확인 전 session을 보호 API identity로 인정하지 않는다", async () => {
    const database = createAuthTestDatabase()
    authMocks.getSession.mockResolvedValue({
      user: { ...sessionUser, emailVerified: false },
    })

    try {
      const runtime = createLearnerAuthRuntime({
        database: createTestDatabaseAdapter(database.db),
        emailDelivery: createInMemoryAuthEmailDelivery(),
        identityProvisioner: createTestIdentityProvisioner(),
        secret: "x".repeat(32),
        webOrigin: "https://app.example.test",
      })

      await expect(
        runtime.identityResolver.resolveIdentity(new Headers())
      ).resolves.toBeNull()
    } finally {
      database.close()
    }
  })

  it("인증 POST body를 16KiB로 제한하고 handler 실행 전에 거절한다", async () => {
    const database = createAuthTestDatabase()

    try {
      const runtime = createLearnerAuthRuntime({
        database: createTestDatabaseAdapter(database.db),
        emailDelivery: createInMemoryAuthEmailDelivery(),
        identityProvisioner: createTestIdentityProvisioner(),
        secret: "x".repeat(32),
        webOrigin: "https://app.example.test",
      })
      const response = await runtime.authHandler(
        new Request("https://app.example.test/api/auth/sign-in/email", {
          body: JSON.stringify({ email: `${"x".repeat(17_000)}@example.test` }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        })
      )

      expect(response.status).toBe(413)
      await expect(response.json()).resolves.toEqual({
        code: "PAYLOAD_TOO_LARGE",
        message: "Authentication request body is too large",
      })
      expect(authMocks.handler).not.toHaveBeenCalled()
    } finally {
      database.close()
    }
  })
})

type LearnerAuthHookConfig = {
  readonly databaseHooks: {
    readonly user: {
      readonly create: {
        readonly after: (user: typeof sessionUser) => Promise<void>
      }
    }
  }
}

function createTestDatabaseAdapter(database: AuthTestDatabase) {
  return createSqliteAuthDatabaseAdapter({
    database,
    schema: {
      account: authAccounts,
      rateLimit: authRateLimits,
      session: authSessions,
      user: authUsers,
      verification: authVerifications,
    },
  })
}

function createTestIdentityProvisioner() {
  return {
    provision: vi.fn(async () => undefined),
  }
}
