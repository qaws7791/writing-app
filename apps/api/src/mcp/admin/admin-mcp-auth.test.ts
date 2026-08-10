import { OAuthErrorCode } from "@modelcontextprotocol/server"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { describe, expect, it, vi } from "vitest"

import { createAdminMcpAuthentication } from "@/mcp/admin/admin-mcp-auth"
import type { AdminMcpAccessTokenVerifier } from "@/mcp/admin/admin-mcp-access-token-store"
import type { AdminMcpConfiguration } from "@/mcp/admin/admin-mcp-configuration"

const configuration: AdminMcpConfiguration = {
  changes: undefined,
  resourceUrl: "http://localhost:8787/mcp/admin",
}
const now = new Date("2029-01-01T00:00:00.000Z")

describe("createAdminMcpAuthentication", () => {
  it("maps a valid stored credential to AuthInfo", async () => {
    const verify = vi.fn<AdminMcpAccessTokenVerifier["verify"]>(async () => ({
      credentialId: "mcp-credential-codex",
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      kind: "valid",
      ownerAdminId: adminIdSchema.parse("admin-owner"),
      scopes: ["admin:mcp:read", "admin:mcp:draft"],
    }))
    const authentication = createAdminMcpAuthentication({
      accessTokenStore: { verify },
      configuration,
      now: () => now,
    })

    await expect(
      authentication.verifier.verifyAccessToken("stored-bearer-token")
    ).resolves.toEqual({
      clientId: "mcp-credential-codex",
      expiresAt: 1_893_456_000,
      extra: { adminId: "admin-owner" },
      resource: new URL(configuration.resourceUrl),
      scopes: ["admin:mcp:read", "admin:mcp:draft"],
      token: "stored-bearer-token",
    })
    expect(verify).toHaveBeenCalledWith({
      now,
      rawToken: "stored-bearer-token",
    })
  })

  it.each([
    ["missing", ""],
    ["unknown", "unknown-token"],
    ["revoked", "revoked-token"],
    ["expired", "expired-token"],
    ["hash-mismatched", "hash-mismatched-token"],
  ])("rejects a %s stored credential", async (_name, rawToken) => {
    const authentication = createAdminMcpAuthentication({
      accessTokenStore: { verify: async () => ({ kind: "invalid" }) },
      configuration,
      now: () => now,
    })

    await expect(
      authentication.verifier.verifyAccessToken(rawToken)
    ).rejects.toMatchObject({ code: OAuthErrorCode.InvalidToken })
  })

  it("rejects an invalid expiry in a nominally valid store result", async () => {
    const authentication = createAdminMcpAuthentication({
      accessTokenStore: {
        verify: async () => ({
          credentialId: "mcp-credential-expired",
          expiresAt: now,
          kind: "valid",
          ownerAdminId: adminIdSchema.parse("admin-owner"),
          scopes: ["admin:mcp:read"],
        }),
      },
      configuration,
      now: () => now,
    })

    await expect(
      authentication.verifier.verifyAccessToken("expired-token")
    ).rejects.toMatchObject({ code: OAuthErrorCode.InvalidToken })
  })

  it("does not convert token store failures into invalid credentials", async () => {
    const storeFailure = new Error("database unavailable")
    const authentication = createAdminMcpAuthentication({
      accessTokenStore: {
        verify: async () => Promise.reject(storeFailure),
      },
      configuration,
      now: () => now,
    })

    await expect(
      authentication.verifier.verifyAccessToken("stored-bearer-token")
    ).rejects.toBe(storeFailure)
  })
})
