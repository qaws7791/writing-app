import { beforeEach, describe, expect, it, vi } from "vitest"

import { createLearnerAuth, createLearnerSessionResolver } from "@/auth/auth"
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
      db: createFakeDatabase([undefined]),
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
      createFakeDatabase([undefined])
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

  it("Better Auth 세션이 없으면 학습자 세션도 없다", async () => {
    const resolver = createLearnerSessionResolver(
      {
        api: {
          getSession: vi.fn(async () => null),
        },
      },
      createFakeDatabase([])
    )

    await expect(resolver.resolveSession(new Headers())).resolves.toBeNull()
  })
})

function createFakeDatabase(results: readonly unknown[]): KwepDatabase {
  let queryIndex = 0

  return {
    select() {
      const result = results[queryIndex]
      queryIndex += 1
      const query = {
        from() {
          return query
        },
        get() {
          return result
        },
        innerJoin() {
          return query
        },
        where() {
          return query
        },
      }

      return query
    },
  } as never
}
