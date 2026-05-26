import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"

describe("platform backend migrations", () => {
  it("creates auth and learning tables", () => {
    const sqlite = new Database(":memory:")

    runContentMigration(sqlite)
    createDatabase(sqlite)

    const tables = sqlite
      .query<{ name: string }, []>(
        "select name from sqlite_master where type = 'table'"
      )
      .all()
      .map((table) => table.name)

    expect(tables).toContain("user")
    expect(tables).toContain("session")
    expect(tables).toContain("account")
    expect(tables).toContain("verification")
    expect(tables).toContain("course_progress")
    expect(tables).toContain("lesson_progress")
    expect(tables).toContain("lesson_answers")
    expect(tables).toContain("feedback_attempts")
  })
})
