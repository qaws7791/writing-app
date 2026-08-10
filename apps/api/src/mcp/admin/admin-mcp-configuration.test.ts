import { describe, expect, it } from "vitest"

import { parseAdminMcpConfiguration } from "@/mcp/admin/admin-mcp-configuration"

const validConfiguration = {
  ADMIN_MCP_ENABLED: "true",
  ADMIN_MCP_RESOURCE_URL: "https://api.example.com/mcp/admin",
} as const

describe("parseAdminMcpConfiguration", () => {
  it("returns undefined when the feature and its configuration are absent", () => {
    expect(parseAdminMcpConfiguration({}, "development")).toBeUndefined()
  })

  it("parses a complete non-production configuration", () => {
    expect(parseAdminMcpConfiguration(validConfiguration, "staging")).toEqual({
      changes: undefined,
      resourceUrl: "https://api.example.com/mcp/admin",
    })
  })

  it("parses explicitly enabled change configuration", () => {
    expect(
      parseAdminMcpConfiguration(
        {
          ...validConfiguration,
          ADMIN_MCP_APPROVAL_TTL_SECONDS: "300",
          ADMIN_MCP_CHANGES_ENABLED: "true",
          ADMIN_MCP_EXECUTION_LEASE_SECONDS: "30",
          ADMIN_MCP_REQUEST_STATE_SECRET:
            "request-state-secret-with-at-least-32-bytes",
        },
        "staging",
        "https://admin.example.com"
      )
    ).toEqual({
      changes: {
        adminOrigin: "https://admin.example.com",
        approvalTtlMs: 300_000,
        executionLeaseMs: 30_000,
        requestStateSecret: "request-state-secret-with-at-least-32-bytes",
      },
      resourceUrl: "https://api.example.com/mcp/admin",
    })
  })

  it("rejects partial change configuration", () => {
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

  it("rejects change configuration while changes are disabled", () => {
    expect(() =>
      parseAdminMcpConfiguration(
        {
          ...validConfiguration,
          ADMIN_MCP_APPROVAL_TTL_SECONDS: "300",
        },
        "staging"
      )
    ).toThrow("ADMIN_MCP_CHANGES_ENABLED=true")
  })

  it("rejects configuration values when the feature is not enabled", () => {
    expect(() =>
      parseAdminMcpConfiguration(
        { ADMIN_MCP_RESOURCE_URL: "https://api.example.com/mcp/admin" },
        "development"
      )
    ).toThrow("ADMIN_MCP_ENABLED=true")
  })

  it.each([
    "ADMIN_MCP_INTROSPECTION_CLIENT_ID",
    "ADMIN_MCP_INTROSPECTION_CLIENT_SECRET",
    "ADMIN_MCP_OAUTH_ISSUER",
    "ADMIN_MCP_OAUTH_METADATA_URL",
    "ADMIN_MCP_PRINCIPAL_BINDINGS_JSON",
    "ADMIN_MCP_OWNER_ADMIN_ID",
    "ADMIN_MCP_OWNER_SUBJECT",
  ])("rejects the removed %s environment variable", (name) => {
    expect(() =>
      parseAdminMcpConfiguration({ [name]: "removed-value" }, "development")
    ).toThrow("더 이상 사용할 수 없습니다")
  })

  it("rejects partial configuration", () => {
    expect(() =>
      parseAdminMcpConfiguration({ ADMIN_MCP_ENABLED: "true" }, "development")
    ).toThrow("resourceUrl")
  })

  it("rejects an invalid feature flag", () => {
    expect(() =>
      parseAdminMcpConfiguration({ ADMIN_MCP_ENABLED: "yes" }, "development")
    ).toThrow("true 또는 false")
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

  it.each([
    "https://api.example.com/another-path",
    "https://api.example.com/mcp/admin?token=value",
    "https://api.example.com/mcp/admin#fragment",
  ])("rejects a resource URL outside the fixed endpoint: %s", (resourceUrl) => {
    expect(() =>
      parseAdminMcpConfiguration(
        {
          ...validConfiguration,
          ADMIN_MCP_RESOURCE_URL: resourceUrl,
        },
        "staging"
      )
    ).toThrow("/mcp/admin 경로만")
  })

  it("rejects credentials embedded in the resource URL", () => {
    expect(() =>
      parseAdminMcpConfiguration(
        {
          ...validConfiguration,
          ADMIN_MCP_RESOURCE_URL:
            "https://user:password@api.example.com/mcp/admin",
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
