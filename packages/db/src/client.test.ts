import { rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"

describe("createDatabase", () => {
  it("enables foreign key enforcement for fresh sqlite connections", () => {
    const databasePath = join(
      tmpdir(),
      `writing-app-client-${crypto.randomUUID()}.sqlite`
    )

    try {
      const migrationConnection = new Database(databasePath, { create: true })
      runContentMigration(migrationConnection)
      migrationConnection.close()

      const runtimeConnection = new Database(databasePath)
      createDatabase(runtimeConnection)

      const foreignKeys = runtimeConnection
        .query<{ foreign_keys: number }, []>("pragma foreign_keys")
        .get()

      runtimeConnection.close()

      expect(foreignKeys?.foreign_keys).toBe(1)
    } finally {
      rmSync(databasePath, { force: true })
    }
  })
})
