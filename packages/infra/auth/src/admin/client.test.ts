import { describe, expect, it, vi } from "vitest"

import {
  createAdminAuthClient,
  isAdminAuthClientError,
} from "#auth/admin/client"

describe("관리자 인증 client", () => {
  it.each([
    { code: "invalid-credentials", status: 401 },
    { code: "rate-limited", status: 429 },
    { code: "unknown", status: 500 },
  ])("실패 status $status를 $code 코드로 옮긴다", async ({ code, status }) => {
    const client = createAdminAuthClient({
      fetch: vi.fn(async () => new Response(null, { status })),
    })

    for (const request of [
      () => client.signOut(),
      () =>
        client.signInWithPassword({
          callbackURL: "/",
          email: "owner@example.test",
          password: "password",
        }),
    ]) {
      const error = await request().catch((cause: unknown) => cause)

      expect(isAdminAuthClientError(error) && error.code).toBe(code)
    }
  })
})
