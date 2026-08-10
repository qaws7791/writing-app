import { createHash } from "node:crypto"

import { adminAuthUsers } from "@workspace/auth/schema"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { runApplicationMigrations } from "@/db/migrate"
import {
  adminMcpAccessTokenEvents,
  adminMcpAccessTokens,
} from "@/mcp/admin/admin-mcp-access-token-schema"
import { createAdminMcpAccessTokenStore } from "@/mcp/admin/admin-mcp-access-token-store"

const actorAdminId = adminIdSchema.parse("admin-token-operator")
const ownerAdminId = adminIdSchema.parse("admin-token-owner")
const createdAt = new Date("2026-08-10T00:00:00.000Z")
const expiresAt = new Date("2026-09-10T00:00:00.000Z")

describe("admin MCP access token store", () => {
  let client: WritingAppDatabaseClient

  beforeEach(() => {
    client = createInMemoryWritingAppDatabase()
    runApplicationMigrations(client.sqlite)
    insertAdmin(client, actorAdminId)
    insertAdmin(client, ownerAdminId)
  })

  afterEach(() => client.close())

  it("stores only a SHA-256 secret digest and verifies the issued token", async () => {
    const store = createAdminMcpAccessTokenStore(client.db)
    const issued = await store.issue({
      actorAdminId,
      createdAt,
      expiresAt,
      ownerAdminId,
      scopes: ["admin:mcp:read", "admin:mcp:draft", "admin:mcp:read"],
    })
    expect(issued.kind).toBe("issued")
    if (issued.kind !== "issued") return

    expect(issued.credentialId).toMatch(/^wmcp_[a-f0-9]{32}$/)
    expect(issued.token).toMatch(/^wmcp_[a-f0-9]{32}\.[A-Za-z0-9_-]{43}$/)
    expect(issued.scopes).toEqual(["admin:mcp:draft", "admin:mcp:read"])

    const row = client.db.select().from(adminMcpAccessTokens).get()
    expect(row).toBeDefined()
    if (row === undefined) return
    const secret = issued.token.slice(issued.token.indexOf(".") + 1)
    expect(row.secretDigest).toBe(
      createHash("sha256").update(secret).digest("hex")
    )
    expect(JSON.stringify(row)).not.toContain(issued.token)
    expect(JSON.stringify(row)).not.toContain(secret)

    await expect(
      store.verify({
        now: new Date("2026-08-11T00:00:00.000Z"),
        rawToken: issued.token,
      })
    ).resolves.toEqual({
      credentialId: issued.credentialId,
      expiresAt,
      kind: "valid",
      ownerAdminId,
      scopes: ["admin:mcp:draft", "admin:mcp:read"],
    })
  })

  it.each([
    ["malformed", "not-a-token"],
    [
      "unknown credential",
      `wmcp_${"f".repeat(32)}.${Buffer.alloc(32, 1).toString("base64url")}`,
    ],
  ])("returns one invalid result for %s", async (_case, rawToken) => {
    const store = createAdminMcpAccessTokenStore(client.db)
    await expect(store.verify({ now: createdAt, rawToken })).resolves.toEqual({
      kind: "invalid",
    })
  })

  it("rejects a wrong secret, expiry, and revocation without deleting the audit ledger", async () => {
    const store = createAdminMcpAccessTokenStore(client.db)
    const issued = await store.issue({
      actorAdminId,
      createdAt,
      expiresAt,
      ownerAdminId,
      scopes: ["admin:mcp:read"],
    })
    expect(issued.kind).toBe("issued")
    if (issued.kind !== "issued") return

    const wrongToken = `${issued.credentialId}.${Buffer.alloc(32, 9).toString("base64url")}`
    await expect(
      store.verify({ now: createdAt, rawToken: wrongToken })
    ).resolves.toEqual({ kind: "invalid" })
    await expect(
      store.verify({ now: expiresAt, rawToken: issued.token })
    ).resolves.toEqual({ kind: "invalid" })

    const revokedAt = new Date("2026-08-12T00:00:00.000Z")
    await expect(
      store.revoke({
        actorAdminId,
        credentialId: issued.credentialId,
        revokedAt,
      })
    ).resolves.toEqual({ kind: "revoked" })
    await expect(
      store.verify({ now: revokedAt, rawToken: issued.token })
    ).resolves.toEqual({ kind: "invalid" })
    await expect(
      store.revoke({
        actorAdminId,
        credentialId: issued.credentialId,
        revokedAt,
      })
    ).resolves.toEqual({ kind: "already-revoked" })

    expect(
      client.db
        .select({
          action: adminMcpAccessTokenEvents.action,
          actorAdminId: adminMcpAccessTokenEvents.actorAdminId,
          credentialId: adminMcpAccessTokenEvents.credentialId,
        })
        .from(adminMcpAccessTokenEvents)
        .all()
    ).toEqual([
      { action: "issued", actorAdminId, credentialId: issued.credentialId },
      { action: "revoked", actorAdminId, credentialId: issued.credentialId },
    ])
  })

  it("fails issuance before persisting when an administrator is missing", async () => {
    const missingAdminId = adminIdSchema.parse("admin-missing")
    const store = createAdminMcpAccessTokenStore(client.db)

    await expect(
      store.issue({
        actorAdminId,
        createdAt,
        expiresAt,
        ownerAdminId: missingAdminId,
        scopes: ["admin:mcp:read"],
      })
    ).resolves.toEqual({ kind: "owner-not-found" })
    await expect(
      store.issue({
        actorAdminId: missingAdminId,
        createdAt,
        expiresAt,
        ownerAdminId,
        scopes: ["admin:mcp:read"],
      })
    ).resolves.toEqual({ kind: "actor-not-found" })

    expect(client.db.select().from(adminMcpAccessTokens).all()).toEqual([])
    expect(client.db.select().from(adminMcpAccessTokenEvents).all()).toEqual([])
  })

  it.each([
    ["missing read scope", ["admin:mcp:draft"]],
    ["unknown scope", ["admin:mcp:read", "admin:mcp:unknown"]],
  ])("rejects %s before persistence", async (_case, scopes) => {
    const store = createAdminMcpAccessTokenStore(client.db)
    await expect(
      store.issue({
        actorAdminId,
        createdAt,
        expiresAt,
        ownerAdminId,
        scopes,
      })
    ).resolves.toEqual({ kind: "invalid-input" })
    expect(client.db.select().from(adminMcpAccessTokens).all()).toEqual([])
    expect(client.db.select().from(adminMcpAccessTokenEvents).all()).toEqual([])
  })

  it("enforces immutable token fields and an append-only lifecycle ledger", async () => {
    const store = createAdminMcpAccessTokenStore(client.db)
    const issued = await store.issue({
      actorAdminId,
      createdAt,
      expiresAt,
      ownerAdminId,
      scopes: ["admin:mcp:read"],
    })
    expect(issued.kind).toBe("issued")
    if (issued.kind !== "issued") return

    expect(() =>
      client.sqlite
        .query(
          "UPDATE admin_mcp_access_tokens SET scopes_json = ? WHERE credential_id = ?"
        )
        .run('["admin:mcp:publish"]', issued.credentialId)
    ).toThrow("immutable")
    expect(() =>
      client.sqlite.query("DELETE FROM admin_mcp_access_token_events").run()
    ).toThrow("append-only")
  })
})

function insertAdmin(
  client: WritingAppDatabaseClient,
  adminId: typeof actorAdminId
): void {
  client.db
    .insert(adminAuthUsers)
    .values({
      createdAt,
      email: `${adminId}@example.com`,
      emailVerified: true,
      id: adminId,
      image: null,
      name: adminId,
      updatedAt: createdAt,
    })
    .run()
}
