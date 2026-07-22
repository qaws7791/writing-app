import { describe, expect, it } from "vitest"

import { runAiFeedbackSchemaMigration } from "@workspace/ai-feedback/migration"
import { runAuthSchemaMigration } from "@workspace/auth/migration"
import { runContentSchemaMigration } from "@workspace/content/migration"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineTestMigration } from "@workspace/db/test-support/application-migration"
import { runIdentitySchemaMigration } from "@workspace/identity/migration"
import { runLearningSchemaMigration } from "@workspace/learning/migration"
import { runOperationsSchemaMigration } from "@workspace/operations/migration"
import { runResourceLibrarySchemaMigration } from "@workspace/resource-library/migration"

import { runApplicationMigrations } from "@/db/migrate"
import {
  assertCurrentApplicationSchema,
  assertNoCrossModuleForeignKeys,
  requiredApplicationTables,
} from "@/db/schema-architecture"
import { findDanglingSchemaReferences } from "@/db/schema-reconciliation"

describe("통합 application migration", () => {
  it("빈 DB에 baseline과 append-only migration을 순서대로 한 번만 적용한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      expect(runApplicationMigrations(database.sqlite)).toEqual([
        { execution: "applied", id: "0000-writing-app-baseline" },
        { execution: "applied", id: "0001-module-schema-ownership" },
      ])
      expect(runApplicationMigrations(database.sqlite)).toEqual([
        { execution: "skipped", id: "0000-writing-app-baseline" },
        { execution: "skipped", id: "0001-module-schema-ownership" },
      ])
      expect(readApplicationTables(database.sqlite)).toEqual(
        expect.arrayContaining([...requiredApplicationTables])
      )
      expect(
        database.sqlite
          .query<
            {
              readonly checksum: string
              readonly execution: string
              readonly id: string
            },
            []
          >(`
            SELECT id, checksum, execution
            FROM api_schema_migrations
            ORDER BY id
          `)
          .all()
      ).toEqual([
        {
          checksum:
            "ca744dd3c34bdd604cfd3de4e57c44dc4299e67bb6685926e4d89aa5821bee25",
          execution: "applied",
          id: "0000-writing-app-baseline",
        },
        {
          checksum:
            "20b1b8a424d4916b565f5b991f221ddc0708a1a654f0cfbeaf6627b53b2636b0",
          execution: "applied",
          id: "0001-module-schema-ownership",
        },
      ])
      expect(() =>
        assertCurrentApplicationSchema(database.sqlite)
      ).not.toThrow()
    } finally {
      database.close()
    }
  })

  it("고정 baseline DB를 row 손실 없이 upgrade하고 legacy role을 identity로 옮긴다", () => {
    const database = createInMemoryWritingAppDatabase()
    const freshDatabase = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(freshDatabase.sqlite)
      runBaselineTestMigration(database.sqlite)
      insertBaselineRows(database.sqlite)
      const before = readPreservedRowCounts(database.sqlite)

      expect(runApplicationMigrations(database.sqlite)).toEqual([
        { execution: "adopted", id: "0000-writing-app-baseline" },
        { execution: "applied", id: "0001-module-schema-ownership" },
      ])

      expect(readPreservedRowCounts(database.sqlite)).toEqual(before)
      expect(
        database.sqlite
          .query<
            {
              readonly adminId: string
              readonly role: string
              readonly version: number
            },
            []
          >(`
            SELECT admin_id AS adminId, role, version
            FROM admin_identity_profiles
          `)
          .get()
      ).toEqual({ adminId: "admin-1", role: "owner", version: 0 })
      expect(readColumns(database.sqlite, "admin_user")).not.toContain("role")
      expect(
        database.sqlite
          .query<{ readonly altText: string; readonly status: string }, []>(`
            SELECT alt_text AS altText, status
            FROM admin_resource_assets
          `)
          .get()
      ).toEqual({ altText: "기존 이미지", status: "active" })
      expect(findDanglingSchemaReferences(database.sqlite)).toEqual([])
      expect(() =>
        assertNoCrossModuleForeignKeys(database.sqlite)
      ).not.toThrow()
      expect(readSchemaSnapshot(database.sqlite)).toEqual(
        readSchemaSnapshot(freshDatabase.sqlite)
      )
    } finally {
      freshDatabase.close()
      database.close()
    }
  })

  it("P10의 idempotent module schema 상태를 채택하고 legacy auth role만 제거한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineTestMigration(database.sqlite)
      runAuthSchemaMigration(database.sqlite)
      runContentSchemaMigration(database.sqlite)
      runAiFeedbackSchemaMigration(database.sqlite)
      runIdentitySchemaMigration(database.sqlite)
      runLearningSchemaMigration(database.sqlite)
      runResourceLibrarySchemaMigration(database.sqlite)
      runOperationsSchemaMigration(database.sqlite)

      expect(runApplicationMigrations(database.sqlite)).toEqual([
        { execution: "adopted", id: "0000-writing-app-baseline" },
        { execution: "applied", id: "0001-module-schema-ownership" },
      ])
      expect(readColumns(database.sqlite, "admin_user")).not.toContain("role")
      expect(() =>
        assertCurrentApplicationSchema(database.sqlite)
      ).not.toThrow()
    } finally {
      database.close()
    }
  })

  it("P11 schema에서 P10 module migration을 다시 실행해도 현재 계약을 유지한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(database.sqlite)
      runAuthSchemaMigration(database.sqlite)
      runContentSchemaMigration(database.sqlite)
      runAiFeedbackSchemaMigration(database.sqlite)
      runIdentitySchemaMigration(database.sqlite)
      runLearningSchemaMigration(database.sqlite)
      runResourceLibrarySchemaMigration(database.sqlite)
      runOperationsSchemaMigration(database.sqlite)

      expect(() =>
        assertCurrentApplicationSchema(database.sqlite)
      ).not.toThrow()
      expect(readColumns(database.sqlite, "admin_user")).not.toContain("role")
    } finally {
      database.close()
    }
  })

  it("알려진 legacy 관리자 MFA schema를 보존 가능한 경로로 정리한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      database.sqlite.exec(`
        CREATE TABLE admin_user (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          email_verified INTEGER NOT NULL,
          image TEXT,
          role TEXT NOT NULL DEFAULT 'operator',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          two_factor_enabled INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE admin_two_factor (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          secret TEXT NOT NULL
        );
        CREATE TABLE admin_mfa_recovery_code (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          code_hash TEXT NOT NULL UNIQUE
        );
        INSERT INTO admin_user (
          id, name, email, email_verified, image, role,
          created_at, updated_at, two_factor_enabled
        ) VALUES (
          'admin-1', '관리자', 'admin@example.test', 1, NULL, 'owner', 1, 1, 1
        );
      `)

      expect(runApplicationMigrations(database.sqlite)).toEqual([
        { execution: "applied", id: "0000-writing-app-baseline" },
        { execution: "applied", id: "0001-module-schema-ownership" },
      ])
      expect(readColumns(database.sqlite, "admin_user")).not.toEqual(
        expect.arrayContaining(["role", "two_factor_enabled"])
      )
      expect(readApplicationTables(database.sqlite)).not.toEqual(
        expect.arrayContaining(["admin_mfa_recovery_code", "admin_two_factor"])
      )
      expect(
        database.sqlite
          .query<{ readonly role: string }, []>(
            "SELECT role FROM admin_identity_profiles WHERE admin_id = 'admin-1'"
          )
          .get()
      ).toEqual({ role: "owner" })
    } finally {
      database.close()
    }
  })

  it("orphan이 있으면 append migration과 이력 기록 전에 fail-closed한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineTestMigration(database.sqlite)
      database.sqlite.exec("PRAGMA foreign_keys = OFF")
      database.sqlite.exec(`
        INSERT INTO learner_profiles (
          user_id, status, display_name, deleted_at
        ) VALUES ('missing-user', 'active', 'orphan', NULL)
      `)
      database.sqlite.exec("PRAGMA foreign_keys = ON")

      expect(() => runApplicationMigrations(database.sqlite)).toThrow(
        "foreign key violation"
      )
      expect(readColumns(database.sqlite, "learner_profiles")).not.toContain(
        "version"
      )
      expect(readApplicationTables(database.sqlite)).not.toContain(
        "api_schema_migrations"
      )
    } finally {
      database.close()
    }
  })

  it("필수 legacy curriculum table이 빠지면 원본을 변경하지 않고 실패한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      database.sqlite.exec(`
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
          id, title, description, category, sort_order
        ) VALUES (
          'legacy-course', '기존 코스', '기존 설명', 'writing', 1
        );
      `)

      expect(() =>
        runApplicationMigrations(database.sqlite, {
          normalizeVersionedStepContent: (_stepId, _stepType, contentJson) =>
            contentJson,
        })
      ).toThrow("legacy curriculum tables are missing")
      expect(readColumns(database.sqlite, "courses")).not.toContain(
        "published_curriculum_version_id"
      )
      expect(
        database.sqlite
          .query<{ readonly id: string }, []>(
            "SELECT id FROM courses WHERE id = 'legacy-course'"
          )
          .get()
      ).toEqual({ id: "legacy-course" })
    } finally {
      database.close()
    }
  })

  it("중복 draft가 있으면 migration 이력을 남기기 전에 실패한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineTestMigration(database.sqlite)
      database.sqlite.exec(`
        INSERT INTO courses (
          id, status, sort_order, published_curriculum_version_id, created_at
        ) VALUES ('course-1', 'active', 1, NULL, 1);
        DROP INDEX course_curriculum_versions_single_draft_idx;
        INSERT INTO course_curriculum_versions (
          id, course_id, revision, edit_version, status, title, description,
          category, visual_key, created_at, updated_at, published_at
        ) VALUES
          ('draft-1', 'course-1', 1, 0, 'draft', '초안 1', '설명',
           '기초', 'expression', 1, 1, NULL),
          ('draft-2', 'course-1', 2, 0, 'draft', '초안 2', '설명',
           '기초', 'expression', 1, 1, NULL);
      `)

      expect(() => runApplicationMigrations(database.sqlite)).toThrow(
        "multiple drafts"
      )
      expect(readApplicationTables(database.sqlite)).not.toContain(
        "api_schema_migrations"
      )
    } finally {
      database.close()
    }
  })

  it("유효하지 않은 module 값이 있으면 migration 이력을 남기기 전에 실패한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineTestMigration(database.sqlite)
      database.sqlite.exec(`
        INSERT INTO user (
          id, name, email, email_verified, image, created_at, updated_at
        ) VALUES ('user-1', '학습자', 'learner@example.test', 1, NULL, 1, 1);
        DROP TABLE learner_profiles;
        CREATE TABLE learner_profiles (
          user_id TEXT PRIMARY KEY NOT NULL REFERENCES user(id) ON DELETE CASCADE,
          status TEXT NOT NULL,
          display_name TEXT,
          deleted_at INTEGER
        );
        INSERT INTO learner_profiles (
          user_id, status, display_name, deleted_at
        ) VALUES ('user-1', 'invalid', '학습자', NULL);
      `)

      expect(() => runApplicationMigrations(database.sqlite)).toThrow(
        "invalid learner profile"
      )
      expect(readApplicationTables(database.sqlite)).not.toContain(
        "api_schema_migrations"
      )
    } finally {
      database.close()
    }
  })

  it("DB 내부 invariant와 cross-module application invariant를 분리한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(database.sqlite)
      database.sqlite.exec(`
        INSERT INTO learner_profiles (
          user_id, status, display_name, deleted_at, version
        ) VALUES ('missing-user', 'active', 'orphan', NULL, 0)
      `)
      expect(findDanglingSchemaReferences(database.sqlite)).toEqual([
        {
          kind: "identity-learner",
          referenceId: "missing-user",
          targetId: "missing-user",
        },
      ])

      expect(() =>
        database.sqlite.exec(`
          INSERT INTO learner_lesson_progress (
            user_id, course_id, curriculum_version_id, lesson_id,
            current_step_id, status, started_at, completed_at, updated_at
          ) VALUES (
            'missing-user', 'missing-course', 'missing-version',
            'missing-lesson', 'missing-step', 'in_progress', 1, NULL, 1
          )
        `)
      ).toThrow("FOREIGN KEY constraint failed")
    } finally {
      database.close()
    }
  })
})

function insertBaselineRows(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  sqlite.exec(`
    INSERT INTO user (
      id, name, email, email_verified, image, created_at, updated_at
    ) VALUES ('user-1', '학습자', 'learner@example.test', 1, NULL, 1, 1);

    INSERT INTO admin_user (
      id, name, email, email_verified, image, role, created_at, updated_at
    ) VALUES (
      'admin-1', '관리자', 'admin@example.test', 1, NULL, 'owner', 1, 1
    );

    INSERT INTO learner_profiles (
      user_id, status, display_name, deleted_at
    ) VALUES ('user-1', 'active', '학습자', NULL);

    INSERT INTO courses (
      id, status, sort_order, published_curriculum_version_id, created_at
    ) VALUES ('course-1', 'active', 1, NULL, 1);

    INSERT INTO course_curriculum_versions (
      id, course_id, revision, edit_version, status, title, description,
      category, visual_key, created_at, updated_at, published_at
    ) VALUES (
      'version-1', 'course-1', 1, 0, 'draft', '코스', '설명',
      '기초', 'expression', 1, 1, NULL
    );

    INSERT INTO course_unit_versions (
      curriculum_version_id, id, title, sort_order, status
    ) VALUES ('version-1', 'unit-1', '단원', 1, 'active');

    INSERT INTO lesson_versions (
      curriculum_version_id, id, unit_id, title, category, description,
      estimated_minutes, summary_json, sort_order, status
    ) VALUES (
      'version-1', 'lesson-1', 'unit-1', '레슨', NULL, '설명',
      5, '[]', 1, 'active'
    );

    INSERT INTO lesson_step_versions (
      curriculum_version_id, id, lesson_id, type, sort_order,
      content_json, status
    ) VALUES (
      'version-1', 'step-1', 'lesson-1', 'WRITE', 1, '{}', 'active'
    );

    INSERT INTO learner_activity_days (
      user_id, activity_date, first_activity_at, last_activity_at,
      completed_lessons, saved_answers
    ) VALUES ('user-1', '2026-07-23', 1, 1, 0, 1);

    INSERT INTO learner_course_progress (
      user_id, course_id, curriculum_version_id, status, started_at,
      completed_at, last_activity_at, updated_at
    ) VALUES (
      'user-1', 'course-1', 'version-1', 'in_progress', 1, NULL, 1, 1
    );

    INSERT INTO learner_lesson_progress (
      user_id, course_id, curriculum_version_id, lesson_id,
      current_step_id, status, started_at, completed_at, updated_at
    ) VALUES (
      'user-1', 'course-1', 'version-1', 'lesson-1', 'step-1',
      'in_progress', 1, NULL, 1
    );

    INSERT INTO learner_lesson_answers (
      user_id, course_id, curriculum_version_id, lesson_id, step_id,
      answer_json, answered_at, updated_at
    ) VALUES (
      'user-1', 'course-1', 'version-1', 'lesson-1', 'step-1',
      '{}', 1, 1
    );

    INSERT INTO ai_feedback_attempts (
      id, user_id, course_id, curriculum_version_id, lesson_id, step_id,
      attempt_number, idempotency_key, status, answer_text, result_json,
      created_at, updated_at, expires_at
    ) VALUES (
      'attempt-1', 'user-1', 'course-1', 'version-1', 'lesson-1',
      'step-1', 1, 'request-1', 'succeeded', '답변', '{}', 1, 1, 2
    );

    INSERT INTO admin_resource_nodes (
      id, kind, parent_id, name, normalized_name, status, trash_root_id,
      created_by, updated_by, created_at, updated_at
    ) VALUES (
      'document-1', 'document', NULL, '문서', '문서', 'active', NULL,
      'admin-1', 'admin-1', 1, 1
    );

    INSERT INTO admin_resource_documents (
      node_id, content_markdown, version
    ) VALUES ('document-1', '본문', 1);

    INSERT INTO admin_resource_assets (
      id, document_id, r2_object_key, content_type, byte_size, created_at
    ) VALUES (
      'asset-1', 'document-1', 'document-1/asset-1.png', 'image/png', 8, 1
    );

    INSERT INTO admin_resource_search (node_id, name, body_text)
    VALUES ('document-1', '문서', '본문');

    INSERT INTO admin_settings (key, value, updated_at)
    VALUES ('notice', '공지', 1);

    INSERT INTO admin_ai_chat_conversations (
      id, title, admin_id, created_at, updated_at
    ) VALUES ('conversation-1', '대화', 'admin-1', 1, 1);

    INSERT INTO admin_ai_chat_messages (
      id, conversation_id, role, content, created_at
    ) VALUES ('message-1', 'conversation-1', 'user', '질문', 1);
  `)
}

function readPreservedRowCounts(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): Readonly<Record<string, number>> {
  const tables = [
    "admin_ai_chat_conversations",
    "admin_ai_chat_messages",
    "admin_resource_assets",
    "admin_resource_documents",
    "admin_resource_nodes",
    "admin_resource_search",
    "admin_settings",
    "admin_user",
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
    "user",
  ] as const

  return Object.fromEntries(
    tables.map((table) => [
      table,
      sqlite
        .query<{ readonly count: number }, []>(
          `SELECT COUNT(*) AS count FROM ${table}`
        )
        .get()?.count ?? 0,
    ])
  )
}

function readApplicationTables(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)
    .all()
    .map((row) => row.name)
}

function readColumns(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  tableName: string
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(`PRAGMA table_info(${tableName})`)
    .all()
    .map((row) => row.name)
}

function readSchemaSnapshot(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): readonly {
  readonly name: string
  readonly sql: string | null
  readonly tableName: string
  readonly type: string
}[] {
  return sqlite
    .query<
      {
        readonly name: string
        readonly sql: string | null
        readonly tableName: string
        readonly type: string
      },
      []
    >(`
      SELECT name, sql, tbl_name AS tableName, type
      FROM sqlite_master
      WHERE name NOT LIKE 'sqlite_%'
      ORDER BY type, name
    `)
    .all()
    .map((entry) => ({
      ...entry,
      sql: entry.sql?.replaceAll("\r\n", "\n").replaceAll("\r", "\n") ?? null,
    }))
}
