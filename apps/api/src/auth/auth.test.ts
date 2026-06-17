import { beforeEach, describe, expect, it, vi } from "vitest"

import { createLearnerAuth, createLearnerSessionResolver } from "@/auth/auth"
import type { LearnerProfileRepository } from "@/auth/learner-onboarding"
import type { KwepDatabase } from "@workspace/db/client"
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
    createLearnerAuth({
      authBaseUrl: "https://api.example.test",
      db: createFakeDatabase(),
      secret: "x".repeat(32),
      webOrigin: "https://app.example.test",
    })

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
    const getSession = vi.fn(async () => ({
      user: sessionUser,
    }))
    const resolver = createLearnerSessionResolver(
      {
        api: {
          getSession,
        },
      },
      createFakeDatabase(),
      createFakeProfileRepository([null])
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
  })

  it("기존 프로필 상태를 세션에 반영하고 active로 되돌리지 않는다", async () => {
    const profileRepository = createFakeProfileRepository([
      { status: "suspended" },
    ])
    const resolver = createLearnerSessionResolver(
      {
        api: {
          getSession: vi.fn(async () => ({
            user: sessionUser,
          })),
        },
      },
      createFakeDatabase(),
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
    const profileRepository = createFakeProfileRepository([null])
    const resolver = createLearnerSessionResolver(
      {
        api: {
          getSession: vi.fn(async () => ({
            user: sessionUser,
          })),
        },
      },
      createFakeDatabase(),
      profileRepository
    )

    await expect(resolver.resolveSession(new Headers())).resolves.toMatchObject(
      {
        user: {
          status: "active",
        },
      }
    )
    expect(profileRepository.ensureActiveProfile).toHaveBeenCalledWith({
      displayName: "학습자",
      userId: "user-1",
    })
  })

  it("Better Auth 세션이 없으면 학습자 세션도 없다", async () => {
    const resolver = createLearnerSessionResolver(
      {
        api: {
          getSession: vi.fn(async () => null),
        },
      },
      createFakeDatabase(),
      createFakeProfileRepository([])
    )

    await expect(resolver.resolveSession(new Headers())).resolves.toBeNull()
  })
})

function createFakeDatabase(): KwepDatabase {
  return {} as never
}

function createFakeProfileRepository(
  profiles: readonly ({ readonly status: "active" | "suspended" } | null)[]
): LearnerProfileRepository {
  let queryIndex = 0

  return {
    ensureActiveProfile: vi.fn(async () => undefined),
    findProfileByUserId: vi.fn(async () => {
      const profile = profiles[queryIndex] ?? null
      queryIndex += 1

      return profile
    }),
  }
}
