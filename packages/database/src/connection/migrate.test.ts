import { afterEach, describe, expect, test } from "bun:test"
import { mkdtempSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { migrateDatabase, openDb } from "./index.js"

const cleanupTasks: Array<() => void> = []

afterEach(() => {
  while (cleanupTasks.length > 0) {
    cleanupTasks.pop()?.()
  }
})

describe("database migration", () => {
  test("creates app and auth tables idempotently", async () => {
    const root = mkdtempSync(join(tmpdir(), "writing-db-"))
    const database = openDb(join(root, "idempotent.sqlite"))
    cleanupTasks.push(() => {
      database.close()
    })

    await migrateDatabase(database.db)
    await migrateDatabase(database.db)

    const rows = database.sqlite
      .query(
        "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name <> '__drizzle_migrations' order by name"
      )
      .all() as Array<{ name: string }>

    expect(rows.map((row) => row.name)).toEqual([
      "account",
      "daily_recommendations",
      "drafts",
      "prompts",
      "saved_prompts",
      "session",
      "user",
      "verification",
    ])
  })
})
