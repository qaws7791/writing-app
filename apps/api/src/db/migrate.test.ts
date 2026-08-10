import { describe, expect, it } from "vitest"

import { createInMemoryWritingAppDatabase } from "@workspace/db/client"

import { runApplicationMigrations } from "@/db/migrate"

describe("application migration", () => {
  it("migration 이력 없이 application table이 있는 DB를 변경하지 않고 거부한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      client.sqlite.exec(`
        CREATE TABLE unknown_application_state (id TEXT PRIMARY KEY);
        INSERT INTO unknown_application_state (id) VALUES ('existing-row');
      `)

      expect(() => runApplicationMigrations(client.sqlite)).toThrow(
        "migration 이력이 없는 비어 있지 않은 database"
      )
      expect(
        client.sqlite
          .query<{ readonly id: string }, []>(
            "SELECT id FROM unknown_application_state"
          )
          .all()
      ).toEqual([{ id: "existing-row" }])
      expect(
        client.sqlite
          .query<{ readonly present: number }, []>(`
            SELECT EXISTS (
              SELECT 1
              FROM sqlite_master
              WHERE type = 'table' AND name = 'api_schema_migrations'
            ) AS present
          `)
          .get()?.present
      ).toBe(0)
    } finally {
      client.close()
    }
  })
})
