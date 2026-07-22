import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { runAuthSchemaMigration } from "#auth/schema/migration"

describe("Better Auth infrastructure schema", () => {
  it("Better Auth table과 DB rate-limit counter를 auth-owned migration으로 만든다", () => {
    const sqlite = new Database(":memory:")

    try {
      runAuthSchemaMigration(sqlite)
      const tables = sqlite
        .query<{ readonly name: string }, []>(
          "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
        )
        .all()
        .map((row) => row.name)

      expect(tables).toEqual([
        "account",
        "admin_account",
        "admin_auth_rate_limit",
        "admin_session",
        "admin_user",
        "admin_verification",
        "auth_rate_limit",
        "session",
        "user",
        "verification",
      ])
    } finally {
      sqlite.close()
    }
  })
})
