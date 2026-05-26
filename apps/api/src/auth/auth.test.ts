import { beforeEach, describe, expect, it, vi } from "vitest"

import type { WritingAppDatabase } from "@workspace/db"

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

  it("trusts proxy headers for auth requests proxied by the web app", () => {
    const input = {
      baseUrl: "http://localhost:4000",
      db: {} as WritingAppDatabase,
      googleClientId: "google-client-id",
      googleClientSecret: "google-client-secret",
      secret: "test-secret-with-enough-length",
    }

    createAuthRuntime(input)

    expect(authMocks.betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        advanced: expect.objectContaining({
          trustedProxyHeaders: true,
        }),
      })
    )
  })
})
