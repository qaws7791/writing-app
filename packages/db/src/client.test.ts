import { rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"
import {
  adminUser,
  curriculumUpgradeDismissals,
  curriculumMigrationApplications,
  curriculumVersionMigrations,
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersions,
  lessonMigrationMappings,
} from "@/schema"

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

describe("admin auth schema", () => {
  it("creates isolated admin auth tables", async () => {
    const sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    const db = createDatabase(sqlite)

    await db.insert(adminUser).values({
      id: "admin-1",
      name: "운영자",
      email: "admin@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date("2026-05-27T00:00:00.000Z"),
      updatedAt: new Date("2026-05-27T00:00:00.000Z"),
    })

    const tables = sqlite
      .query<{ name: string }, []>(
        "select name from sqlite_master where type = 'table' order by name"
      )
      .all()
      .map((row) => row.name)

    expect(tables).toContain("admin_user")
    expect(tables).toContain("admin_session")
    expect(tables).toContain("admin_account")
    expect(tables).toContain("admin_verification")
  })
})

describe("curriculum version schema", () => {
  it("creates curriculum version tables", async () => {
    const sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    createDatabase(sqlite)

    const tables = sqlite
      .query<{ name: string }, []>(
        "select name from sqlite_master where type = 'table' order by name"
      )
      .all()
      .map((row) => row.name)

    expect(tables).toContain("curriculum_versions")
    expect(tables).toContain("curriculum_version_chapters")
    expect(tables).toContain("curriculum_version_lessons")
    expect(curriculumVersions).toBeDefined()
    expect(curriculumVersionChapters).toBeDefined()
    expect(curriculumVersionLessons).toBeDefined()
  })
})

describe("curriculum migration schema", () => {
  it("creates curriculum migration tables", async () => {
    const sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    createDatabase(sqlite)

    const tables = sqlite
      .query<{ name: string }, []>(
        "select name from sqlite_master where type = 'table' order by name"
      )
      .all()
      .map((row) => row.name)

    expect(tables).toContain("curriculum_version_migrations")
    expect(tables).toContain("lesson_migration_mappings")
    expect(tables).toContain("curriculum_migration_applications")
    expect(tables).toContain("curriculum_upgrade_dismissals")
    expect(curriculumVersionMigrations).toBeDefined()
    expect(lessonMigrationMappings).toBeDefined()
    expect(curriculumMigrationApplications).toBeDefined()
    expect(curriculumUpgradeDismissals).toBeDefined()
  })
})
