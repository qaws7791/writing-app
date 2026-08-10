import { describe, expect, it } from "vitest"

import {
  AdminMcpSyntheticConfigurationError,
  parseAdminMcpSyntheticEnvironment,
  type AdminMcpSyntheticEnvironment,
} from "@/scripts/admin-mcp-staging-synthetic-check"

const bearerToken = "test-only-static-bearer-token"
const validEnvironment = {
  ADMIN_MCP_SYNTHETIC_BEARER_TOKEN: bearerToken,
  ADMIN_MCP_SYNTHETIC_RESOURCE_URL: "https://mcp.staging.example.com/mcp/admin",
} satisfies AdminMcpSyntheticEnvironment

describe("admin MCP staging synthetic environment", () => {
  it("parses the static bearer configuration", () => {
    expect(parseAdminMcpSyntheticEnvironment(validEnvironment)).toEqual({
      bearerToken,
      resourceUrl: new URL("https://mcp.staging.example.com/mcp/admin"),
    })
  })

  it.each([
    "ADMIN_MCP_SYNTHETIC_BEARER_TOKEN",
    "ADMIN_MCP_SYNTHETIC_RESOURCE_URL",
  ] as const)("rejects a missing %s", (name) => {
    expect(() =>
      parseAdminMcpSyntheticEnvironment({
        ...validEnvironment,
        [name]: undefined,
      })
    ).toThrow(
      new AdminMcpSyntheticConfigurationError(`${name}를 설정해야 합니다.`)
    )
  })

  it("rejects an unsafe resource URL without exposing the token", () => {
    let caught: unknown
    try {
      parseAdminMcpSyntheticEnvironment({
        ...validEnvironment,
        ADMIN_MCP_SYNTHETIC_RESOURCE_URL: "http://mcp.example.com/mcp/admin",
      })
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(AdminMcpSyntheticConfigurationError)
    expect((caught as Error).message).not.toContain(bearerToken)
  })

  it("rejects a non-canonical MCP resource pathname", () => {
    expect(() =>
      parseAdminMcpSyntheticEnvironment({
        ...validEnvironment,
        ADMIN_MCP_SYNTHETIC_RESOURCE_URL:
          "https://mcp.staging.example.com/mcp/admin/",
      })
    ).toThrow(
      new AdminMcpSyntheticConfigurationError(
        "ADMIN_MCP_SYNTHETIC_RESOURCE_URL pathname은 /mcp/admin이어야 합니다."
      )
    )
  })
})
