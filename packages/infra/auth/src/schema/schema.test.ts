import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"

describe("Better Auth infrastructure schema", () => {
  it("application migration이 Better Auth table과 rate-limit counter를 만든다", () => {
    const sqlite = new Database(":memory:")

    try {
      runCurrentTestMigration(sqlite)
      const tables = sqlite
        .query<{ readonly name: string }, []>(
          "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
        )
        .all()
        .map((row) => row.name)

      expect(tables).toEqual(
        expect.arrayContaining([
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
      )
    } finally {
      sqlite.close()
    }
  })
})
