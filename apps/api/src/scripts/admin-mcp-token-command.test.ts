import { adminAuthUsers } from "@workspace/auth/schema"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { runApplicationMigrations } from "@/db/migrate"
import {
  parseIssueAdminMcpTokenArguments,
  issueAdminMcpToken,
} from "@/scripts/issue-admin-mcp-token"
import {
  parseRevokeAdminMcpTokenArguments,
  revokeAdminMcpToken,
} from "@/scripts/revoke-admin-mcp-token"
import { resolveAdminMcpTokenDatabaseUrl } from "@/scripts/admin-mcp-token-command"

const adminId = adminIdSchema.parse("admin-1")
const createdAt = new Date("2026-08-10T00:00:00.000Z")
const expiresAt = new Date("2026-09-10T00:00:00.000Z")

describe("admin MCP token commands", () => {
  let client: WritingAppDatabaseClient

  beforeEach(() => {
    client = createInMemoryWritingAppDatabase()
    runApplicationMigrations(client.sqlite)
    client.db
      .insert(adminAuthUsers)
      .values({
        createdAt,
        email: "admin-1@example.com",
        emailVerified: true,
        id: adminId,
        image: null,
        name: "관리자",
        updatedAt: createdAt,
      })
      .run()
  })

  afterEach(() => client.close())

  it("requires explicit expiry and at least the read scope", () => {
    expect(() =>
      parseIssueAdminMcpTokenArguments([
        "--actor-admin-id=admin-1",
        "--owner-admin-id=admin-1",
        "--scope=admin:mcp:read",
      ])
    ).toThrow("--expires-at")

    const options = parseIssueAdminMcpTokenArguments([
      "--actor-admin-id=admin-1",
      "--owner-admin-id=admin-1",
      `--expires-at=${expiresAt.toISOString()}`,
      "--scope=admin:mcp:read",
      "--scope=admin:mcp:draft",
    ])
    expect(options).toEqual({
      actorAdminId: adminId,
      expiresAt,
      ownerAdminId: adminId,
      scopes: ["admin:mcp:read", "admin:mcp:draft"],
    })
  })

  it("formats the raw token exactly once and revokes by public credential ID", async () => {
    const issuedOutput = await issueAdminMcpToken({
      database: client.db,
      now: createdAt,
      options: {
        actorAdminId: adminId,
        expiresAt,
        ownerAdminId: adminId,
        scopes: ["admin:mcp:read"],
      },
    })
    const issued: unknown = JSON.parse(issuedOutput)
    expect(issued).toMatchObject({
      expiresAt: expiresAt.toISOString(),
      ownerAdminId: adminId,
      scopes: ["admin:mcp:read"],
    })
    if (
      typeof issued !== "object" ||
      issued === null ||
      !("token" in issued) ||
      typeof issued.token !== "string" ||
      !("credentialId" in issued) ||
      typeof issued.credentialId !== "string"
    ) {
      throw new Error("발급 출력 형식이 올바르지 않습니다.")
    }
    expect(issuedOutput.split(issued.token)).toHaveLength(2)

    const revokeOptions = parseRevokeAdminMcpTokenArguments([
      "--actor-admin-id=admin-1",
      `--credential-id=${issued.credentialId}`,
    ])
    await expect(
      revokeAdminMcpToken({
        database: client.db,
        now: new Date("2026-08-11T00:00:00.000Z"),
        options: revokeOptions,
      })
    ).resolves.toBe(
      JSON.stringify({ credentialId: issued.credentialId, kind: "revoked" })
    )
  })

  it("requires explicit production approval and database confirmation", () => {
    expect(() =>
      resolveAdminMcpTokenDatabaseUrl({
        DATABASE_URL: "production.sqlite",
        NODE_ENV: "production",
      })
    ).toThrow("ADMIN_MCP_TOKEN_MANAGEMENT_APPROVED=true")
    expect(
      resolveAdminMcpTokenDatabaseUrl({
        ADMIN_MCP_TOKEN_EXPECTED_DATABASE_URL: "production.sqlite",
        ADMIN_MCP_TOKEN_MANAGEMENT_APPROVED: "true",
        DATABASE_URL: "production.sqlite",
        NODE_ENV: "production",
      })
    ).toBe("production.sqlite")
  })
})
