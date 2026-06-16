import { describe, expect, it, vi } from "vitest"

import { createAdminSessionResolver } from "@/auth/admin-auth"

const adminSession = {
  createdAt: new Date("2026-06-15T09:00:00.000Z"),
  email: "admin@example.com",
  id: "admin-1",
  image: null,
  name: "관리자",
  role: "owner",
  updatedAt: new Date("2026-06-15T09:00:00.000Z"),
}

describe("Admin Better Auth session resolver", () => {
  it("Better Auth getSession 결과를 관리자 세션으로 변환한다", async () => {
    const getSession = vi.fn(async () => ({
      user: adminSession,
    }))
    const resolver = createAdminSessionResolver({
      api: {
        getSession,
      },
    })
    const headers = new Headers({
      Cookie: "admin_session_token=admin-token-1.signature",
    })

    await expect(resolver.resolveSession(headers)).resolves.toEqual({
      admin: {
        email: "admin@example.com",
        id: "admin-1",
        name: "관리자",
        role: "owner",
      },
    })
    expect(getSession).toHaveBeenCalledWith({
      headers,
    })
  })

  it("Better Auth 세션이 없으면 관리자 세션도 없다", async () => {
    const resolver = createAdminSessionResolver({
      api: {
        getSession: vi.fn(async () => null),
      },
    })

    await expect(resolver.resolveSession(new Headers())).resolves.toBeNull()
  })
})
