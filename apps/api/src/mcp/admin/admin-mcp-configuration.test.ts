import { describe, expect, it } from "vitest"

import { parseAdminMcpConfiguration } from "@/mcp/admin/admin-mcp-configuration"

const validConfiguration = {
  ADMIN_MCP_ENABLED: "true",
  ADMIN_MCP_INTROSPECTION_CLIENT_ID: "writing-app-resource-server",
  ADMIN_MCP_INTROSPECTION_CLIENT_SECRET: "test-secret",
  ADMIN_MCP_OAUTH_ISSUER: "https://auth.example.com",
  ADMIN_MCP_OAUTH_METADATA_URL:
    "https://auth.example.com/.well-known/oauth-authorization-server",
  ADMIN_MCP_OWNER_ADMIN_ID: "admin-owner",
  ADMIN_MCP_OWNER_SUBJECT: "owner-subject",
  ADMIN_MCP_RESOURCE_URL: "https://api.example.com/mcp/admin",
} as const

describe("parseAdminMcpConfiguration", () => {
  it("returns undefined when the feature and its configuration are absent", () => {
    expect(parseAdminMcpConfiguration({}, "development")).toBeUndefined()
  })

  it("parses a complete non-production configuration", () => {
    expect(parseAdminMcpConfiguration(validConfiguration, "staging")).toEqual({
      changes: undefined,
      introspectionClientId: "writing-app-resource-server",
      introspectionClientSecret: "test-secret",
      oauthIssuer: "https://auth.example.com",
      oauthMetadataUrl:
        "https://auth.example.com/.well-known/oauth-authorization-server",
      ownerAdminId: "admin-owner",
      ownerSubject: "owner-subject",
      resourceUrl: "https://api.example.com/mcp/admin",
    })
  })

  it("parses explicitly enabled content-change configuration", () => {
    expect(
      parseAdminMcpConfiguration(
        {
          ...validConfiguration,
          ADMIN_MCP_APPROVAL_TTL_SECONDS: "300",
          ADMIN_MCP_CHANGES_ENABLED: "true",
          ADMIN_MCP_EXECUTION_LEASE_SECONDS: "30",
          ADMIN_MCP_REQUEST_STATE_SECRET:
            "distinct-request-state-secret-at-least-32-bytes",
        },
        "staging",
        "https://admin.example.com"
      )
    ).toMatchObject({
      changes: {
        adminOrigin: "https://admin.example.com",
        approvalTtlMs: 300_000,
        executionLeaseMs: 30_000,
        requestStateSecret: "distinct-request-state-secret-at-least-32-bytes",
      },
    })
  })

  it("rejects partial content-change configuration", () => {
    expect(() =>
      parseAdminMcpConfiguration(
        {
          ...validConfiguration,
          ADMIN_MCP_CHANGES_ENABLED: "true",
        },
        "staging"
      )
    ).toThrow("approvalTtlSeconds")
  })

  it("rejects reuse of the introspection secret for request state", () => {
    const sharedSecret = "shared-secret-value-with-at-least-32-bytes"
    expect(() =>
      parseAdminMcpConfiguration(
        {
          ...validConfiguration,
          ADMIN_MCP_APPROVAL_TTL_SECONDS: "300",
          ADMIN_MCP_CHANGES_ENABLED: "true",
          ADMIN_MCP_EXECUTION_LEASE_SECONDS: "30",
          ADMIN_MCP_INTROSPECTION_CLIENT_SECRET: sharedSecret,
          ADMIN_MCP_REQUEST_STATE_SECRET: sharedSecret,
        },
        "staging"
      )
    ).toThrow("introspection client secret과 다른 값")
  })

  it("rejects configuration values when the feature is not enabled", () => {
    expect(() =>
      parseAdminMcpConfiguration(
        { ADMIN_MCP_OWNER_SUBJECT: "owner-subject" },
        "development"
      )
    ).toThrow("ADMIN_MCP_ENABLED=true")
  })

  it("rejects partial configuration", () => {
    expect(() =>
      parseAdminMcpConfiguration({ ADMIN_MCP_ENABLED: "true" }, "development")
    ).toThrow("값이 없거나 올바르지 않습니다")
  })

  it("rejects an external plaintext resource URL", () => {
    expect(() =>
      parseAdminMcpConfiguration(
        {
          ...validConfiguration,
          ADMIN_MCP_RESOURCE_URL: "http://api.example.com/mcp/admin",
        },
        "staging"
      )
    ).toThrow("HTTPS 또는 loopback URL")
  })

  it("rejects a resource URL outside the fixed MCP path", () => {
    expect(() =>
      parseAdminMcpConfiguration(
        {
          ...validConfiguration,
          ADMIN_MCP_RESOURCE_URL: "https://api.example.com/another-path",
        },
        "staging"
      )
    ).toThrow("/mcp/admin 경로만")
  })

  it("rejects credentials embedded in an OAuth URL", () => {
    expect(() =>
      parseAdminMcpConfiguration(
        {
          ...validConfiguration,
          ADMIN_MCP_OAUTH_METADATA_URL:
            "https://user:password@auth.example.com/.well-known/oauth-authorization-server",
        },
        "staging"
      )
    ).toThrow("username 또는 password")
  })

  it("rejects production activation", () => {
    expect(() =>
      parseAdminMcpConfiguration(validConfiguration, "production")
    ).toThrow("production 관리자 MCP를 활성화할 수 없습니다")
  })
})
