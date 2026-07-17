import { beforeEach, describe, expect, it, vi } from "vitest"

import type { LearnerProfileRepository } from "@workspace/core/auth"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import {
  createLearnerAuth,
  createLearnerSessionResolver,
} from "@/adapters/auth/learner-auth"
import { learnerAccountStatuses } from "@workspace/contracts/status"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
} from "@workspace/db/schema"

const authMocks = vi.hoisted(() => ({
  betterAuth: vi.fn(() => ({
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  })),
  drizzleAdapter: vi.fn(() => "drizzle-adapter"),
}))

vi.mock("better-auth", () => ({
  betterAuth: authMocks.betterAuth,
}))

vi.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: authMocks.drizzleAdapter,
}))

const now = new Date("2026-06-15T09:00:00.000Z")
const sessionUser = {
  createdAt: now,
  email: "learner@example.com",
  id: "user-1",
  image: null,
  name: "학습자",
}

describe("학습자 Better Auth", () => {
  beforeEach(() => {
    authMocks.betterAuth.mockClear()
    authMocks.drizzleAdapter.mockClear()
  })

  it("Drizzle adapter에 Better Auth core model schema key를 명시한다", () => {
    const database = createMigratedTestDatabase()

    try {
      createLearnerAuth({
        authBaseUrl: "https://api.example.test",
        db: database.db,
        profileRepository: createTestLearnerProfileRepository(),
        secret: "x".repeat(32),
        webOrigin: "https://app.example.test",
      })
    } finally {
      database.close()
    }

    const adapterConfig = authMocks.drizzleAdapter.mock.calls.at(0)?.at(1)

    expect(adapterConfig).toMatchObject({
      provider: "sqlite",
      schema: {
        account: authAccounts,
        session: authSessions,
        user: authUsers,
        verification: authVerifications,
      },
    })
  })

  it("학습자 전용 URL, secret, origin과 session cookie 설정을 보존한다", () => {
    const database = createMigratedTestDatabase()
    const secret = "learner-secret-0123456789abcdef"

    try {
      createLearnerAuth({
        authBaseUrl: "https://api.example.test",
        cookieDomain: "example.test",
        db: database.db,
        profileRepository: createTestLearnerProfileRepository(),
        secret,
        webOrigin: "https://app.example.test",
      })
    } finally {
      database.close()
    }

    expect(authMocks.betterAuth.mock.calls.at(0)?.at(0)).toMatchObject({
      advanced: {
        cookies: {
          session_token: {
            name: learnerSessionCookieName,
          },
        },
        crossSubDomainCookies: {
          domain: "example.test",
          enabled: true,
        },
      },
      baseURL: "https://api.example.test",
      plugins: [],
      secret,
      trustedOrigins: ["https://app.example.test"],
    })
  })

  it("테스트 인증 플래그가 켜졌을 때만 테스트 로그인 플러그인을 등록한다", () => {
    const database = createMigratedTestDatabase()

    try {
      createLearnerAuth({
        authBaseUrl: "https://api.example.test",
        db: database.db,
        profileRepository: createTestLearnerProfileRepository(),
        secret: "x".repeat(32),
        testAuthEnabled: true,
        webOrigin: "https://app.example.test",
      })
    } finally {
      database.close()
    }

    const authConfig = authMocks.betterAuth.mock.calls.at(0)?.at(0)

    expect(authConfig).toMatchObject({
      plugins: [
        {
          id: "learner-test-auth",
        },
      ],
    })
  })

  it("Better Auth 사용자 생성 hook을 프로필 저장소에 연결한다", async () => {
    const database = createMigratedTestDatabase()
    const profileRepository = createTestLearnerProfileRepository()

    try {
      createLearnerAuth({
        authBaseUrl: "https://api.example.test",
        db: database.db,
        profileRepository,
        secret: "x".repeat(32),
        webOrigin: "https://app.example.test",
      })
      const authConfig = authMocks.betterAuth.mock.calls.at(0)?.at(0) as
        | LearnerAuthHookConfig
        | undefined

      await authConfig?.databaseHooks.user.create.after(sessionUser)

      expect(profileRepository.ensureActiveProfile).toHaveBeenCalledWith({
        displayName: "학습자",
        userId: "user-1",
      })
    } finally {
      database.close()
    }
  })

  it("Better Auth getSession 결과를 학습자 세션으로 변환한다", async () => {
    const getSession = vi.fn(async () => ({
      user: sessionUser,
    }))
    const resolver = createLearnerSessionResolver(
      {
        api: {
          getSession,
        },
      },
      createTestLearnerProfileRepository()
    )
    const headers = new Headers({
      Cookie: "learner_session_token=session-token-1.signature",
    })

    await expect(resolver.resolveSession(headers)).resolves.toEqual({
      user: {
        email: "learner@example.com",
        id: "user-1",
        image: null,
        joinedAt: now.toISOString(),
        name: "학습자",
        status: "active",
      },
    })
    expect(getSession).toHaveBeenCalledWith({
      headers,
    })
  })

  it("기존 프로필 상태를 세션에 반영하고 active로 되돌리지 않는다", async () => {
    const profileRepository = createTestLearnerProfileRepository({
      status: learnerAccountStatuses.suspended,
    })
    const resolver = createLearnerSessionResolver(
      {
        api: {
          getSession: vi.fn(async () => ({
            user: sessionUser,
          })),
        },
      },
      profileRepository
    )

    await expect(resolver.resolveSession(new Headers())).resolves.toMatchObject(
      {
        user: {
          status: "suspended",
        },
      }
    )
    expect(profileRepository.ensureActiveProfile).not.toHaveBeenCalled()
  })

  it("프로필이 누락된 세션은 active 프로필을 한 번 생성한다", async () => {
    const profileRepository = createTestLearnerProfileRepository(null)
    const resolver = createLearnerSessionResolver(
      {
        api: {
          getSession: vi.fn(async () => ({
            user: sessionUser,
          })),
        },
      },
      profileRepository
    )

    await expect(resolver.resolveSession(new Headers())).resolves.toMatchObject(
      {
        user: {
          status: "active",
        },
      }
    )
    expect(profileRepository.ensureActiveProfile).toHaveBeenCalledOnce()
  })

  it("Better Auth 세션이 없으면 학습자 세션도 없다", async () => {
    const profileRepository = createTestLearnerProfileRepository()
    const resolver = createLearnerSessionResolver(
      {
        api: {
          getSession: vi.fn(async () => null),
        },
      },
      profileRepository
    )

    await expect(resolver.resolveSession(new Headers())).resolves.toBeNull()
    expect(profileRepository.findProfileByUserId).not.toHaveBeenCalled()
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

function createMigratedTestDatabase() {
  const database = createInMemoryWritingAppDatabase()

  runBaselineMigration(database.sqlite)

  return database
}

function createTestLearnerProfileRepository(
  profile: Awaited<
    ReturnType<LearnerProfileRepository["findProfileByUserId"]>
  > = { status: learnerAccountStatuses.active }
) {
  return {
    ensureActiveProfile: vi.fn(async () => undefined),
    findProfileByUserId: vi.fn(async () => profile),
  } satisfies LearnerProfileRepository
}
