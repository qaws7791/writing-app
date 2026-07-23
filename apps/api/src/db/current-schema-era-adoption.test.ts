import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import {
  adoptCurrentSchemaEra,
  inspectCurrentSchemaEraAdoption,
} from "@/db/current-schema-era-adoption"
import { currentSchemaBaseline, runApplicationMigrations } from "@/db/migrate"

const previousMigrationLineage = [
  [
    "0000-writing-app-baseline",
    "ca744dd3c34bdd604cfd3de4e57c44dc4299e67bb6685926e4d89aa5821bee25",
  ],
  [
    "0001-module-schema-ownership",
    "20b1b8a424d4916b565f5b991f221ddc0708a1a654f0cfbeaf6627b53b2636b0",
  ],
  [
    "0002-cross-module-reference-integrity",
    "86451557db525a8dd446daeca77dca54d8f241cb64c2cf5be08d7a2b6deb8d65",
  ],
  [
    "0003-remove-unused-operations",
    "f757d500fc548052b97de4938d94f86c41377df3ca25ba0868b7923a537ea622",
  ],
] as const

describe("current schema era adoption", () => {
  it("검증된 최종 이전 계보를 현재 baseline 선언으로 원자적으로 바꾼다", () => {
    const sqlite = createPreviousLineageDatabase()

    try {
      expect(inspectCurrentSchemaEraAdoption(sqlite)).toEqual({
        previousMigrationIds: previousMigrationLineage.map(([id]) => id),
        status: "ready",
      })
      expect(adoptCurrentSchemaEra(sqlite)).toEqual({
        previousMigrationIds: previousMigrationLineage.map(([id]) => id),
        status: "adopted",
      })
      expect(inspectCurrentSchemaEraAdoption(sqlite)).toEqual({
        status: "already-current",
      })
      expect(
        sqlite
          .query<{ readonly checksum: string; readonly id: string }, []>(
            "SELECT id, checksum FROM api_schema_migrations"
          )
          .all()
      ).toEqual([
        {
          checksum: currentSchemaBaseline.checksum,
          id: currentSchemaBaseline.id,
        },
      ])
      expect(runApplicationMigrations(sqlite)).toEqual([
        { execution: "skipped", id: currentSchemaBaseline.id },
      ])
    } finally {
      sqlite.close()
    }
  })

  it("변조된 이전 계보는 schema를 바꾸지 않고 거부한다", () => {
    const sqlite = createPreviousLineageDatabase()

    try {
      sqlite
        .query<void, [string]>(`
          UPDATE api_schema_migrations
          SET checksum = ?
          WHERE id = '0002-cross-module-reference-integrity'
        `)
        .run("a".repeat(64))

      expect(() => adoptCurrentSchemaEra(sqlite)).toThrow(
        "최종 이전 migration 계보만 지원"
      )
      expect(
        sqlite
          .query<{ readonly id: string }, []>(
            "SELECT id FROM api_schema_migrations ORDER BY id"
          )
          .all()
      ).toEqual(previousMigrationLineage.map(([id]) => ({ id })))
    } finally {
      sqlite.close()
    }
  })
})

function createPreviousLineageDatabase(): Database {
  const sqlite = new Database(":memory:")
  sqlite.exec("PRAGMA foreign_keys = ON")
  runApplicationMigrations(sqlite)
  sqlite.exec("DELETE FROM api_schema_migrations")

  const insert = sqlite.query<void, [string, string]>(`
    INSERT INTO api_schema_migrations (id, checksum)
    VALUES (?, ?)
  `)
  for (const [id, checksum] of previousMigrationLineage) {
    insert.run(id, checksum)
  }

  return sqlite
}
