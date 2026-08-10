import { Buffer } from "node:buffer"

import { OAuthErrorCode } from "@modelcontextprotocol/server"
import { describe, expect, it, vi } from "vitest"

import {
  createAdminMcpAuthentication,
  type AdminMcpFetch,
} from "@/mcp/admin/admin-mcp-auth"
import type { AdminMcpConfiguration } from "@/mcp/admin/admin-mcp-configuration"

const configuration: AdminMcpConfiguration = {
  changes: undefined,
  introspectionClientId: "resource server",
  introspectionClientSecret: "secret:value",
  oauthIssuer: "http://localhost:9000",
  oauthMetadataUrl:
    "http://localhost:9000/.well-known/oauth-authorization-server",
  ownerAdminId: "admin-owner" as AdminMcpConfiguration["ownerAdminId"],
  ownerSubject: "owner-subject",
  resourceUrl: "http://localhost:8787/mcp/admin",
}

const oauthMetadata = {
  authorization_endpoint: "http://localhost:9000/authorize",
  introspection_endpoint: "http://localhost:9000/introspect",
  issuer: configuration.oauthIssuer,
  response_types_supported: ["code"],
  token_endpoint: "http://localhost:9000/token",
}

describe("createAdminMcpAuthentication", () => {
  it("loads metadata and maps a valid introspection response to AuthInfo", async () => {
    const requests: { init: RequestInit | undefined; url: string }[] = []
    const fetchImplementation: AdminMcpFetch = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        requests.push({ init, url })
        if (url === configuration.oauthMetadataUrl) {
          return Response.json(oauthMetadata)
        }
        return Response.json({
          active: true,
          aud: [configuration.resourceUrl],
          client_id: "approved-agent-client",
          exp: 1_893_456_000,
          iss: configuration.oauthIssuer,
          scope: "admin:mcp:read profile",
          sub: configuration.ownerSubject,
        })
      }
    )

    const authentication = await createAdminMcpAuthentication({
      configuration,
      fetch: fetchImplementation,
      now: () => new Date("2029-01-01T00:00:00.000Z"),
    })
    const authInfo =
      await authentication.verifier.verifyAccessToken("access-token-value")

    expect(authInfo).toEqual({
      clientId: "approved-agent-client",
      expiresAt: 1_893_456_000,
      extra: { adminId: "admin-owner" },
      resource: new URL(configuration.resourceUrl),
      scopes: ["admin:mcp:read", "profile"],
      token: "access-token-value",
    })
    const introspectionRequest = requests.at(-1)
    expect(introspectionRequest?.url).toBe(oauthMetadata.introspection_endpoint)
    expect(introspectionRequest?.init?.method).toBe("POST")
    expect(
      new Headers(introspectionRequest?.init?.headers).get("authorization")
    ).toBe(
      `Basic ${Buffer.from("resource+server:secret%3Avalue").toString("base64")}`
    )
    expect(String(introspectionRequest?.init?.body)).toContain(
      "token=access-token-value"
    )
  })

  it.each([
    ["inactive", { active: false }],
    ["wrong issuer", { iss: "http://localhost:9000/another-issuer" }],
    ["wrong audience", { aud: ["http://localhost:8787/another-resource"] }],
    ["wrong subject", { sub: "another-subject" }],
    ["expired", { exp: 1_830_297_600 }],
  ])("rejects an %s token", async (_name, override) => {
    const fetchImplementation: AdminMcpFetch = vi.fn(
      async (input: RequestInfo | URL) => {
        if (String(input) === configuration.oauthMetadataUrl) {
          return Response.json(oauthMetadata)
        }
        return Response.json({
          active: true,
          aud: [configuration.resourceUrl],
          client_id: "approved-agent-client",
          exp: 1_893_456_000,
          iss: configuration.oauthIssuer,
          scope: "admin:mcp:read",
          sub: configuration.ownerSubject,
          ...override,
        })
      }
    )
    const authentication = await createAdminMcpAuthentication({
      configuration,
      fetch: fetchImplementation,
      now: () => new Date("2029-01-01T00:00:00.000Z"),
    })

    const verification = authentication.verifier.verifyAccessToken("token")
    await expect(verification).rejects.toMatchObject({
      code: OAuthErrorCode.InvalidToken,
    })
  })

  it("rejects metadata whose issuer differs from configuration", async () => {
    const fetchImplementation: AdminMcpFetch = vi.fn(async () =>
      Response.json({ ...oauthMetadata, issuer: "http://localhost:9000/other" })
    )

    await expect(
      createAdminMcpAuthentication({
        configuration,
        fetch: fetchImplementation,
        now: () => new Date("2029-01-01T00:00:00.000Z"),
      })
    ).rejects.toThrow("OAuth metadata is invalid")
  })
})
