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

import { createAuthRuntime } from "@/auth/auth"

describe("createAuthRuntime", () => {
  beforeEach(() => {
    authMocks.betterAuth.mockClear()
    authMocks.drizzleAdapter.mockClear()
  })

  it("passes configured frontend origins to Better Auth", () => {
    const input = {
      baseUrl: "http://localhost:4000",
      db: {} as WritingAppDatabase,
      googleClientId: "google-client-id",
      googleClientSecret: "google-client-secret",
      secret: "test-secret-with-enough-length",
      trustedOrigins: ["http://localhost:3001"],
    }

    createAuthRuntime(input)

    expect(authMocks.betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        trustedOrigins: ["http://localhost:3001"],
      })
    )
  })

  it("does not trust application proxy headers for direct API auth requests", () => {
    const input = {
      baseUrl: "https://api.example.com",
      db: {} as WritingAppDatabase,
      googleClientId: "google-client-id",
      googleClientSecret: "google-client-secret",
      secret: "test-secret-with-enough-length",
    }

    createAuthRuntime(input)

    expect(authMocks.betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        advanced: expect.not.objectContaining({
          trustedProxyHeaders: true,
        }),
      })
    )
  })

  it("enables cross-subdomain cookies when a cookie domain is configured", () => {
    const input = {
      baseUrl: "https://api.example.com",
      cookieDomain: "example.com",
      db: {} as WritingAppDatabase,
      googleClientId: "google-client-id",
      googleClientSecret: "google-client-secret",
      secret: "test-secret-with-enough-length",
      trustedOrigins: ["https://app.example.com"],
    }

    createAuthRuntime(input)

    expect(authMocks.betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        advanced: {
          crossSubDomainCookies: {
            domain: "example.com",
            enabled: true,
          },
        },
      })
    )
  })

  it("does not enable email and password authentication", () => {
    const input = {
      baseUrl: "http://localhost:4000",
      db: {} as WritingAppDatabase,
      googleClientId: "google-client-id",
      googleClientSecret: "google-client-secret",
      secret: "test-secret-with-enough-length",
    }

    createAuthRuntime(input)

    expect(authMocks.betterAuth).toHaveBeenCalledWith(
      expect.not.objectContaining({
        emailAndPassword: expect.anything(),
      })
    )
  })
})
