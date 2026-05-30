import { rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { configureSqliteConnection, createDatabase } from "@/client"
import { runContentMigration } from "@/migrations/run-content-migration"
import { adminUser } from "@/schema"

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

  it("configures sqlite for shared file based runtime access", () => {
    const databasePath = join(
      tmpdir(),
      `writing-app-client-${crypto.randomUUID()}.sqlite`
    )

    try {
      const sqlite = new Database(databasePath, { create: true })
      configureSqliteConnection(sqlite)

      const foreignKeys = sqlite
        .query<{ foreign_keys: number }, []>("pragma foreign_keys")
        .get()
      const journalMode = sqlite
        .query<{ journal_mode: string }, []>("pragma journal_mode")
        .get()
      const synchronous = sqlite
        .query<{ synchronous: number }, []>("pragma synchronous")
        .get()
      const busyTimeout = sqlite
        .query<{ timeout: number }, []>("pragma busy_timeout")
        .get()
      const walAutocheckpoint = sqlite
        .query<{ wal_autocheckpoint: number }, []>("pragma wal_autocheckpoint")
        .get()
      const journalSizeLimit = sqlite
        .query<{ journal_size_limit: number }, []>("pragma journal_size_limit")
        .get()
      const mmapSize = sqlite
        .query<{ mmap_size: number }, []>("pragma mmap_size")
        .get()
      const tempStore = sqlite
        .query<{ temp_store: number }, []>("pragma temp_store")
        .get()

      sqlite.close()

      expect(foreignKeys?.foreign_keys).toBe(1)
      expect(journalMode?.journal_mode).toBe("wal")
      expect(synchronous?.synchronous).toBe(1)
      expect(busyTimeout?.timeout).toBe(5000)
      expect(walAutocheckpoint?.wal_autocheckpoint).toBe(1000)
      expect(journalSizeLimit?.journal_size_limit).toBe(67_108_864)
      expect(mmapSize?.mmap_size).toBe(268_435_456)
      expect(tempStore?.temp_store).toBe(2)
    } finally {
      rmSync(databasePath, { force: true })
      rmSync(`${databasePath}-shm`, { force: true })
      rmSync(`${databasePath}-wal`, { force: true })
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

describe("current curriculum schema", () => {
  it("does not create curriculum version or migration tables", async () => {
    const sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    createDatabase(sqlite)

    const tables = sqlite
      .query<{ name: string }, []>(
        "select name from sqlite_master where type = 'table' order by name"
      )
      .all()
      .map((row) => row.name)

    expect(tables).not.toContain("curriculum_versions")
    expect(tables).not.toContain("curriculum_version_chapters")
    expect(tables).not.toContain("curriculum_version_lessons")
    expect(tables).not.toContain("curriculum_version_migrations")
    expect(tables).not.toContain("lesson_migration_mappings")
    expect(tables).not.toContain("curriculum_migration_applications")
    expect(tables).not.toContain("curriculum_upgrade_dismissals")

    const courseColumns = sqlite
      .query<{ name: string }, []>("pragma table_info(courses)")
      .all()
      .map((row) => row.name)
    const chapterColumns = sqlite
      .query<{ name: string }, []>("pragma table_info(course_chapters)")
      .all()
      .map((row) => row.name)
    const courseLessonColumns = sqlite
      .query<{ name: string }, []>("pragma table_info(course_lessons)")
      .all()
      .map((row) => row.name)

    expect(courseColumns).toContain("curriculum_revision")
    expect(chapterColumns).toContain("status")
    expect(chapterColumns).not.toContain("label")
    expect(courseLessonColumns).toContain("status")
  })
})
