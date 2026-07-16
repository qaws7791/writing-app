import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import {
  createInMemoryWritingAppDatabase,
  createReadOnlyWritingAppDatabase,
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "@/client"
import { runBaselineMigration } from "@/migrations/migrate"

describe("Writing App DB client", () => {
  it("기본 SQLite DB 경로는 실행 위치와 무관하게 저장소 루트 data를 가리킨다", () => {
    const expectedPath = fileURLToPath(
      new URL("../../../data/api.sqlite", import.meta.url)
    )
    const originalCwd = process.cwd()

    try {
      process.chdir("/tmp")

      expect(getDefaultDatabaseUrl()).toBe(expectedPath)
    } finally {
      process.chdir(originalCwd)
    }
  })

  it("상대 file: SQLite URL은 현재 실행 위치 기준 파일 경로로 연다", () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), "writing-app-db-client-"))
    const originalCwd = process.cwd()

    try {
      mkdirSync(join(tempDirectory, "apps", "api", "data"), {
        recursive: true,
      })
      mkdirSync(join(tempDirectory, "data"), { recursive: true })
      process.chdir(join(tempDirectory, "apps", "api"))

      const client = createWritingAppDatabase("file:../../data/api.sqlite")

      try {
        const databaseFile = client.sqlite
          .query<{ readonly file: string }, []>("PRAGMA database_list")
          .all()
          .at(0)?.file
        const journalMode = client.sqlite
          .query<{ readonly journal_mode: string }, []>("PRAGMA journal_mode")
          .get()?.journal_mode
        const busyTimeout = client.sqlite
          .query<{ readonly timeout: number }, []>("PRAGMA busy_timeout")
          .get()?.timeout
        const synchronous = client.sqlite
          .query<{ readonly synchronous: number }, []>("PRAGMA synchronous")
          .get()?.synchronous

        expect(realpathSync(databaseFile ?? "")).toBe(
          realpathSync(join(tempDirectory, "data", "api.sqlite"))
        )
        expect(journalMode).toBe("wal")
        expect(busyTimeout).toBe(5000)
        expect(synchronous).toBe(1)
      } finally {
        client.close()
      }
    } finally {
      process.chdir(originalCwd)
      rmSync(tempDirectory, { force: true, recursive: true })
    }
  })

  it("in-memory SQLite DB에 새 baseline schema를 적용한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(client.sqlite)

      const tableNames = client.sqlite
        .query<{ readonly name: string }, []>(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
        .all()
        .map((row) => row.name)

      expect(tableNames).toEqual([
        "account",
        "admin_account",
        "admin_ai_chat_conversations",
        "admin_ai_chat_messages",
        "admin_resource_assets",
        "admin_resource_documents",
        "admin_resource_nodes",
        "admin_resource_search",
        "admin_resource_search_config",
        "admin_resource_search_content",
        "admin_resource_search_data",
        "admin_resource_search_docsize",
        "admin_resource_search_idx",
        "admin_session",
        "admin_settings",
        "admin_user",
        "admin_verification",
        "ai_feedback_attempts",
        "course_curriculum_versions",
        "course_unit_versions",
        "courses",
        "learner_activity_days",
        "learner_course_progress",
        "learner_lesson_answers",
        "learner_lesson_progress",
        "learner_profiles",
        "lesson_step_versions",
        "lesson_versions",
        "session",
        "user",
        "verification",
      ])

      const accountColumnNames = client.sqlite
        .query<{ readonly name: string }, []>("PRAGMA table_info(account)")
        .all()
        .map((row) => row.name)

      expect(accountColumnNames).toEqual([
        "id",
        "user_id",
        "account_id",
        "provider_id",
        "access_token",
        "refresh_token",
        "access_token_expires_at",
        "refresh_token_expires_at",
        "scope",
        "id_token",
        "password",
        "created_at",
        "updated_at",
      ])

      const adminAccountColumnNames = client.sqlite
        .query<{ readonly name: string }, []>(
          "PRAGMA table_info(admin_account)"
        )
        .all()
        .map((row) => row.name)

      expect(adminAccountColumnNames).toEqual(accountColumnNames)

      const lessonForeignKeys = client.sqlite
        .query<{ readonly table: string }, []>(
          "PRAGMA foreign_key_list(lesson_versions)"
        )
        .all()
        .map((row) => row.table)
        .sort()

      expect(lessonForeignKeys).toEqual([
        "course_curriculum_versions",
        "course_unit_versions",
        "course_unit_versions",
      ])
    } finally {
      client.close()
    }
  })

  it("읽기 전용 client는 기존 DB를 조회하지만 쓰기를 거부한다", () => {
    const tempDirectory = mkdtempSync(
      join(tmpdir(), "writing-app-db-readonly-")
    )
    const databasePath = join(tempDirectory, "audit.sqlite")
    const writableClient = createWritingAppDatabase(databasePath)

    try {
      runBaselineMigration(writableClient.sqlite)
    } finally {
      writableClient.close()
    }

    const readOnlyClient = createReadOnlyWritingAppDatabase(databasePath)

    try {
      expect(
        readOnlyClient.sqlite
          .query<{ readonly count: number }, []>(
            "SELECT COUNT(*) AS count FROM admin_user"
          )
          .get()?.count
      ).toBe(0)
      expect(() =>
        readOnlyClient.sqlite.exec(
          "INSERT INTO admin_user (id, name, email, email_verified, role, created_at, updated_at) VALUES ('admin-1', '관리자', 'admin@example.com', 1, 'owner', 0, 0)"
        )
      ).toThrow()
    } finally {
      readOnlyClient.close()
      rmSync(tempDirectory, { force: true, recursive: true })
    }
  })

  it("필수 legacy 테이블이 빠진 DB는 변경하지 않고 이관을 실패시킨다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      client.sqlite.exec(`
        CREATE TABLE courses (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          sort_order INTEGER NOT NULL,
          curriculum_revision INTEGER NOT NULL DEFAULT 0
        );
        INSERT INTO courses (
          id,
          title,
          description,
          category,
          sort_order
        ) VALUES (
          'legacy-course',
          '기존 코스',
          '기존 설명',
          'writing',
          1
        );
      `)

      expect(() => runBaselineMigration(client.sqlite)).toThrow(
        "legacy curriculum tables are missing"
      )

      const courseColumns = client.sqlite
        .query<{ readonly name: string }, []>("PRAGMA table_info(courses)")
        .all()
        .map((row) => row.name)
      expect(courseColumns).not.toContain("published_curriculum_version_id")
      expect(
        client.sqlite
          .query<{ readonly id: string }, []>(
            "SELECT id FROM courses WHERE id = 'legacy-course'"
          )
          .get()
      ).toEqual({ id: "legacy-course" })
    } finally {
      client.close()
    }
  })
})
