import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { createContentModule } from "@workspace/content/module"
import {
  createReadOnlyWritingAppDatabase,
  createWritingAppDatabase,
} from "@workspace/db/client"

import { createVerifiedApplicationDatabaseBackup } from "@/db/application-database-backup"
import { currentSchemaBaseline, runApplicationMigrations } from "@/db/migrate"
import { requiredApplicationBackupTableNames } from "@/db/required-application-tables"
import { seedApplicationDatabase } from "@/db/seed"

// 실제 콘텐츠 seed를 수행하는 suite이므로, 저장소 전체 병렬 실행에서 CPU가
// 포화될 때 기본 5초 timeout을 넘긴다.
describe(
  "application database backup과 독립 restore",
  { timeout: 20_000 },
  () => {
    it("seed된 snapshot을 독립 검증하고 application read를 수행한다", async () => {
      const directory = mkdtempSync(join(tmpdir(), "writing-app-restore-"))
      const sourcePath = join(directory, "source.sqlite")
      const backupPath = join(directory, "backup", "snapshot.sqlite")

      try {
        const source = createWritingAppDatabase(sourcePath)
        try {
          await seedApplicationDatabase(source)
        } finally {
          source.close()
        }

        expect(
          createVerifiedApplicationDatabaseBackup({ backupPath, sourcePath })
        ).toMatchObject({
          kind: "database-backup-verified",
          verification: {
            integrityCheck: "ok",
            requiredTableReadSmoke: "ok",
          },
        })

        const restored = createReadOnlyWritingAppDatabase(backupPath)
        try {
          expect(
            restored.sqlite
              .query<{ readonly id: string }, []>(
                "SELECT id FROM api_schema_migrations"
              )
              .all()
          ).toEqual([
            { id: currentSchemaBaseline.id },
            { id: "0001-reporting-views" },
            { id: "0002-audit-events-course-restore" },
            { id: "0003-focused-writing" },
          ])
          expect(
            restored.sqlite
              .query<{ readonly name: string }, []>(`
              SELECT name
              FROM sqlite_master
              WHERE type = 'table'
                AND name NOT LIKE 'sqlite_%'
              ORDER BY name
            `)
              .all()
              .map(({ name }) => name)
          ).toEqual([...requiredApplicationBackupTableNames].sort())

          const content = createContentModule({
            assetIdGenerator: { next: () => "unused" as never },
            assetImageProcessor: {
              process: async () => {
                throw new Error(
                  "읽기 전용 검증에서 asset 처리를 호출할 수 없습니다."
                )
              },
            },
            assetStorage: null,
            clock: { now: () => new Date("2026-07-23T00:00:00.000Z") },
            courseIdGenerator: { next: () => "unused" as never },
            database: restored.db,
          })
          await expect(
            content.application.listPublishedCourses()
          ).resolves.not.toHaveLength(0)
        } finally {
          restored.close()
        }
      } finally {
        rmSync(directory, { recursive: true })
      }
    })

    it("migration 이력이 없는 DB는 backup 전에 차단한다", () => {
      const directory = mkdtempSync(join(tmpdir(), "writing-app-backup-block-"))
      const sourcePath = join(directory, "source.sqlite")
      const backupPath = join(directory, "backup.sqlite")

      try {
        const source = createWritingAppDatabase(sourcePath)
        try {
          source.sqlite.exec("CREATE TABLE unknown_state (id TEXT)")
        } finally {
          source.close()
        }

        expect(() =>
          createVerifiedApplicationDatabaseBackup({ backupPath, sourcePath })
        ).toThrow("database backup blocked")
      } finally {
        rmSync(directory, { recursive: true })
      }
    })

    it("현재 migration 이력이 있어도 필수 table이 없으면 backup 전에 차단한다", () => {
      const directory = mkdtempSync(
        join(tmpdir(), "writing-app-backup-schema-")
      )
      const sourcePath = join(directory, "source.sqlite")
      const backupPath = join(directory, "backup.sqlite")

      try {
        const source = createWritingAppDatabase(sourcePath)
        try {
          runApplicationMigrations(source.sqlite)
          source.sqlite.exec("DROP TABLE audit_events")
        } finally {
          source.close()
        }

        expect(() =>
          createVerifiedApplicationDatabaseBackup({ backupPath, sourcePath })
        ).toThrow("required tables missing: audit_events")
      } finally {
        rmSync(directory, { recursive: true })
      }
    })
  }
)
