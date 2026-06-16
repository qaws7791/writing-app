import { describe, expect, it } from "vitest"

import {
  createAdminBearerSessionResolver,
  readBetterAuthAdminSessionToken,
} from "@/auth/admin-auth"
import type { KwepDatabase } from "@workspace/db/client"

const now = new Date("2026-06-15T09:00:00.000Z")
const adminSession = {
  email: "admin@example.com",
  id: "admin-1",
  name: "관리자",
  role: "owner",
}

describe("Admin Bearer session resolver", () => {
  it("서명된 Better Auth 쿠키 값에서 세션 토큰만 읽는다", () => {
    expect(readBetterAuthAdminSessionToken("admin-token-1.signature")).toBe(
      "admin-token-1"
    )
    expect(readBetterAuthAdminSessionToken("admin-token-1")).toBe(
      "admin-token-1"
    )
  })

  it("세션 테이블의 유효 토큰으로 관리자 세션을 찾는다", async () => {
    const resolver = createAdminBearerSessionResolver(
      createFakeDatabase([adminSession]),
      () => now
    )

    await expect(resolver.resolveSession("admin-token-1")).resolves.toEqual({
      admin: {
        email: "admin@example.com",
        id: "admin-1",
        name: "관리자",
        role: "owner",
      },
    })
  })

  it("서명된 Better Auth 쿠키 값에서 세션 토큰만 사용한다", async () => {
    const resolver = createAdminBearerSessionResolver(
      createFakeDatabase([adminSession]),
      () => now
    )

    await expect(
      resolver.resolveSession("admin-token-1.signature")
    ).resolves.toEqual({
      admin: {
        email: "admin@example.com",
        id: "admin-1",
        name: "관리자",
        role: "owner",
      },
    })
  })

  it("관리자 ID를 Bearer 토큰으로 인증하지 않는다", async () => {
    const resolver = createAdminBearerSessionResolver(
      createFakeDatabase([undefined, adminSession]),
      () => now
    )

    await expect(resolver.resolveSession("admin-1")).resolves.toBeNull()
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
