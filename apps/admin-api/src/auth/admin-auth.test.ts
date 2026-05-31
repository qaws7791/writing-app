import { beforeEach, describe, expect, it, vi } from "vitest"

import type { WritingAppDatabase } from "@workspace/db/client"

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

import { createAdminAuthRuntime } from "@/auth/admin-auth"

describe("createAdminAuthRuntime", () => {
  beforeEach(() => {
    authMocks.betterAuth.mockClear()
    authMocks.drizzleAdapter.mockClear()
  })

  it("keeps the admin cookie prefix and trusted origins", () => {
    createAdminAuthRuntime({
      baseUrl: "https://admin-api.example.com",
      db: {} as WritingAppDatabase,
      secret: "admin-secret",
      trustedOrigins: ["https://admin.example.com"],
    })

    expect(authMocks.betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        advanced: expect.objectContaining({
          cookiePrefix: "writing-app-admin",
        }),
        trustedOrigins: ["https://admin.example.com"],
      })
    )
  })

  it("does not trust application proxy headers for direct admin API auth requests", () => {
    createAdminAuthRuntime({
      baseUrl: "https://admin-api.example.com",
      db: {} as WritingAppDatabase,
      secret: "admin-secret",
    })

    expect(authMocks.betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        advanced: expect.not.objectContaining({
          trustedProxyHeaders: true,
        }),
      })
    )
  })

  it("enables cross-subdomain admin cookies when a cookie domain is configured", () => {
    createAdminAuthRuntime({
      baseUrl: "https://admin-api.example.com",
      cookieDomain: "example.com",
      db: {} as WritingAppDatabase,
      secret: "admin-secret",
      trustedOrigins: ["https://admin.example.com"],
    })

    expect(authMocks.betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        advanced: expect.objectContaining({
          cookiePrefix: "writing-app-admin",
          crossSubDomainCookies: {
            domain: "example.com",
            enabled: true,
          },
        }),
      })
    )
  })
})
