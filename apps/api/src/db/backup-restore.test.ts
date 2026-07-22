import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { createContentModule } from "@workspace/content/module"
import {
  createReadOnlyWritingAppDatabase,
  createWritingAppDatabase,
} from "@workspace/db/client"
import { createVerifiedDatabaseBackup } from "@workspace/db/database-backup"
import { ok } from "@workspace/kernel/result"

import { requiredDatabaseBackupTables } from "@/db/schema-architecture"
import { seedApplicationDatabase } from "@/db/seed"

describe("P11 schema backup과 독립 restore", () => {
  it("seed된 현재 schema snapshot을 별도 경로에서 검증하고 application read를 수행한다", async () => {
    const directory = mkdtempSync(join(tmpdir(), "writing app p11 restore "))
    const sourcePath = join(directory, "source.sqlite")
    const backupPath = join(directory, "backup", "snapshot.sqlite")
    const source = createWritingAppDatabase(sourcePath)

    try {
      await seedApplicationDatabase(source)
      source.close()

      const report = createVerifiedDatabaseBackup({
        backupPath,
        requiredTables: requiredDatabaseBackupTables,
        sourcePath,
      })
      expect(report.verification).toMatchObject({
        integrityCheck: "ok",
        requiredTableReadSmoke: "ok",
      })

      const restored = createReadOnlyWritingAppDatabase(backupPath)
      try {
        expect(
          restored.sqlite
            .query<{ readonly id: string }, []>(
              "SELECT id FROM api_schema_migrations ORDER BY id"
            )
            .all()
        ).toEqual([
          { id: "0000-writing-app-baseline" },
          { id: "0001-module-schema-ownership" },
        ])
        const content = createContentModule({
          clock: { now: () => new Date("2026-07-23T00:00:00.000Z") },
          courseIdGenerator: { next: () => "unused" as never },
          database: restored.db,
          eventFailureObserver: () => undefined,
          eventIdGenerator: { next: () => "unused" },
          eventPublisher: {
            publishCurriculumPublished: async () => ok(undefined),
          },
          resetGuard: { authorize: () => ok(undefined) },
        })
        await expect(
          content.learningQuery.listPublishedCourses()
        ).resolves.not.toHaveLength(0)
      } finally {
        restored.close()
      }
    } finally {
      source.close()
      rmSync(directory, { force: true, recursive: true })
    }
  })
})
