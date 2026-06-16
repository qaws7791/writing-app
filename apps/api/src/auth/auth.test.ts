import { describe, expect, it } from "vitest"

import {
  createBearerSessionResolver,
  readBetterAuthSessionToken,
} from "@/auth/auth"
import type { KwepDatabase } from "@workspace/db/client"

const now = new Date("2026-06-15T09:00:00.000Z")
const sessionUser = {
  createdAt: now,
  email: "learner@example.com",
  id: "user-1",
  image: null,
  name: "학습자",
}

describe("Bearer session resolver", () => {
  it("서명된 Better Auth 쿠키 값에서 세션 토큰만 읽는다", () => {
    expect(readBetterAuthSessionToken("session-token-1.signature")).toBe(
      "session-token-1"
    )
    expect(readBetterAuthSessionToken("session-token-1")).toBe(
      "session-token-1"
    )
  })

  it("세션 테이블의 유효 토큰으로 학습자 세션을 찾는다", async () => {
    const resolver = createBearerSessionResolver(
      createFakeDatabase([sessionUser, undefined]),
      () => now
    )

    await expect(resolver.resolveSession("session-token-1")).resolves.toEqual({
      user: {
        email: "learner@example.com",
        id: "user-1",
        image: null,
        joinedAt: now.toISOString(),
        name: "학습자",
        status: "active",
      },
    })
  })

  it("서명된 Better Auth 쿠키 값에서 세션 토큰만 사용한다", async () => {
    const resolver = createBearerSessionResolver(
      createFakeDatabase([sessionUser, undefined]),
      () => now
    )

    await expect(
      resolver.resolveSession("session-token-1.signature")
    ).resolves.toEqual({
      user: {
        email: "learner@example.com",
        id: "user-1",
        image: null,
        joinedAt: now.toISOString(),
        name: "학습자",
        status: "active",
      },
    })
  })

  it("사용자 ID를 Bearer 토큰으로 인증하지 않는다", async () => {
    const resolver = createBearerSessionResolver(
      createFakeDatabase([undefined, sessionUser, undefined]),
      () => now
    )

    await expect(resolver.resolveSession("user-1")).resolves.toBeNull()
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
