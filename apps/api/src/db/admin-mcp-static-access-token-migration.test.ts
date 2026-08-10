import { Database } from "bun:sqlite"

import { afterEach, describe, expect, it } from "vitest"

import currentSchemaBaselineSql from "../../drizzle/0000-current-schema-baseline.sql" with { type: "text" }
import adminMcpStaticAccessTokensSql from "../../drizzle/0006-admin-mcp-static-access-tokens.sql" with { type: "text" }

const openDatabases: Database[] = []

afterEach(() => {
  for (const database of openDatabases.splice(0)) database.close()
})

describe("admin MCP static access token migration", () => {
  it("adds token and append-only lifecycle tables with valid foreign keys", () => {
    const database = new Database(":memory:")
    openDatabases.push(database)
    database.exec("PRAGMA foreign_keys = ON")
    database.exec(currentSchemaBaselineSql)
    database.exec(adminMcpStaticAccessTokensSql)

    expect(
      database
        .query<{ name: string }, []>(`
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
            AND name IN (
              'admin_mcp_access_tokens',
              'admin_mcp_access_token_events'
            )
          ORDER BY name
        `)
        .all()
        .map(({ name }) => name)
    ).toEqual(["admin_mcp_access_token_events", "admin_mcp_access_tokens"])
    expect(database.query("PRAGMA foreign_key_check").all()).toEqual([])
  })

  it("rejects persisted scopes outside the fixed allowlist or without read", () => {
    const database = new Database(":memory:")
    openDatabases.push(database)
    database.exec("PRAGMA foreign_keys = ON")
    database.exec(currentSchemaBaselineSql)
    database.exec(adminMcpStaticAccessTokensSql)
    database
      .query(`
        INSERT INTO admin_user (
          id, name, email, email_verified, created_at, updated_at
        ) VALUES ('admin-1', '관리자', 'admin@example.com', 1, 1, 1)
      `)
      .run()

    expect(() =>
      database
        .query(`
          INSERT INTO admin_mcp_access_tokens (
            created_at,
            credential_id,
            expires_at,
            owner_admin_id,
            scopes_json,
            secret_digest
          ) VALUES (?, ?, ?, ?, ?, ?)
        `)
        .run(
          1,
          `wmcp_${"a".repeat(32)}`,
          2,
          "admin-1",
          '["admin:mcp:unknown"]',
          "b".repeat(64)
        )
    ).toThrow("scopes are invalid")
  })
})
