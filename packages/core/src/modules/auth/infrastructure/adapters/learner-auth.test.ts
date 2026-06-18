import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  createLearnerAuth,
  createLearnerSessionResolver,
} from "@workspace/core/modules/auth/infrastructure/adapters/learner-auth"
import { learnerAccountStatuses } from "@workspace/core/shared/kernel/status"
import { createInMemoryKwepDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
  learnerProfiles,
} from "@workspace/db/schema"
import { eq } from "drizzle-orm"

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

  it("Better Auth getSession 결과를 학습자 세션으로 변환한다", async () => {
    const database = createMigratedTestDatabase()
    const getSession = vi.fn(async () => ({
      user: sessionUser,
    }))

    try {
      seedSessionUser(database.db)
      const resolver = createLearnerSessionResolver(
        {
          api: {
            getSession,
          },
        },
        database.db
      )
      const headers = new Headers({
        Cookie: "kwep_session=session-token-1.signature",
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
    } finally {
      database.close()
    }
  })

  it("기존 프로필 상태를 세션에 반영하고 active로 되돌리지 않는다", async () => {
    const database = createMigratedTestDatabase()

    try {
      seedSessionUser(database.db)
      database.db
        .insert(learnerProfiles)
        .values({
          deletedAt: null,
          displayName: "학습자",
          status: learnerAccountStatuses.suspended,
          userId: "user-1",
        })
        .run()
      const resolver = createLearnerSessionResolver(
        {
          api: {
            getSession: vi.fn(async () => ({
              user: sessionUser,
            })),
          },
        },
        database.db
      )

      await expect(
        resolver.resolveSession(new Headers())
      ).resolves.toMatchObject({
        user: {
          status: "suspended",
        },
      })
      expect(readLearnerProfileStatus(database.db, "user-1")).toBe("suspended")
    } finally {
      database.close()
    }
  })

  it("프로필이 누락된 세션은 active 프로필을 한 번 생성한다", async () => {
    const database = createMigratedTestDatabase()

    try {
      seedSessionUser(database.db)
      const resolver = createLearnerSessionResolver(
        {
          api: {
            getSession: vi.fn(async () => ({
              user: sessionUser,
            })),
          },
        },
        database.db
      )

      await expect(
        resolver.resolveSession(new Headers())
      ).resolves.toMatchObject({
        user: {
          status: "active",
        },
      })
      expect(readLearnerProfileStatus(database.db, "user-1")).toBe("active")
    } finally {
      database.close()
    }
  })

  it("Better Auth 세션이 없으면 학습자 세션도 없다", async () => {
    const database = createMigratedTestDatabase()

    try {
      const resolver = createLearnerSessionResolver(
        {
          api: {
            getSession: vi.fn(async () => null),
          },
        },
        database.db
      )

      await expect(resolver.resolveSession(new Headers())).resolves.toBeNull()
    } finally {
      database.close()
    }
  })
})

function createMigratedTestDatabase() {
  const database = createInMemoryKwepDatabase()

  runBaselineMigration(database.sqlite)

  return database
}

function seedSessionUser(
  db: ReturnType<typeof createMigratedTestDatabase>["db"]
): void {
  db.insert(authUsers)
    .values({
      createdAt: now,
      email: sessionUser.email,
      emailVerified: true,
      id: sessionUser.id,
      image: sessionUser.image,
      name: sessionUser.name,
      updatedAt: now,
    })
    .run()
}

function readLearnerProfileStatus(
  db: ReturnType<typeof createMigratedTestDatabase>["db"],
  userId: string
) {
  return db
    .select({ status: learnerProfiles.status })
    .from(learnerProfiles)
    .where(eq(learnerProfiles.userId, userId))
    .get()?.status
}
