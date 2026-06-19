import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { Database } from "bun:sqlite"

import { describe, expect, it } from "vitest"

import { createWritingAppDatabase } from "@/client"
import {
  authUsers,
  courses,
  courseUnits,
  learnerLessonAnswers,
  learnerLessonProgress,
  learnerProfiles,
  lessons,
  lessonSteps,
} from "@/schema"
import { seedDatabase } from "@/seeds/seed"

describe("개발 DB seed 실행", () => {
  it("baseline migration을 적용하고 기준 콘텐츠를 삽입한다", async () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), "writing-app-seed-"))
    const databaseUrl = join(tempDirectory, "api.sqlite")

    try {
      await seedDatabase(databaseUrl)

      const client = createWritingAppDatabase(databaseUrl)

      try {
        expect(client.db.select().from(courses).all()).toHaveLength(5)
        expect(client.db.select().from(lessons).all()).toHaveLength(44)
        expect(client.db.select().from(lessonSteps).all()).toHaveLength(136)
        expect(client.db.select().from(authUsers).all()).toMatchObject([
          {
            email: "learner@example.com",
            id: "user-1",
            name: "학습자",
          },
        ])
        expect(client.db.select().from(learnerProfiles).all()).toMatchObject([
          {
            displayName: "학습자",
            status: "active",
            userId: "user-1",
          },
        ])
      } finally {
        client.close()
      }
    } finally {
      removeTempDirectory(tempDirectory)
    }
  })

  it("seed 재실행 시 기존 학습 진행과 답변 기록을 보존한다", async () => {
    const tempDirectory = mkdtempSync(
      join(tmpdir(), "writing-app-seed-preserve-")
    )
    const databaseUrl = join(tempDirectory, "api.sqlite")

    try {
      await seedDatabase(databaseUrl)

      const client = createWritingAppDatabase(databaseUrl)

      try {
        const now = new Date("2026-06-15T00:00:00.000Z")

        client.db
          .insert(learnerLessonProgress)
          .values({
            completedAt: now,
            currentStepIndex: 2,
            lessonId: "l1",
            startedAt: now,
            status: "completed",
            updatedAt: now,
            userId: "user-1",
          })
          .run()

        client.db
          .insert(learnerLessonAnswers)
          .values({
            answeredAt: now,
            answerJson: JSON.stringify({ kind: "test-answer" }),
            lessonId: "l1",
            stepId: "l1-s1",
            updatedAt: now,
            userId: "user-1",
          })
          .run()
      } finally {
        client.close()
      }

      await seedDatabase(databaseUrl)

      const reseededClient = createWritingAppDatabase(databaseUrl)

      try {
        expect(
          reseededClient.db.select().from(learnerLessonProgress).all()
        ).toEqual([
          expect.objectContaining({
            lessonId: "l1",
            status: "completed",
            userId: "user-1",
          }),
        ])
        expect(
          reseededClient.db.select().from(learnerLessonAnswers).all()
        ).toEqual([
          expect.objectContaining({
            answerJson: JSON.stringify({ kind: "test-answer" }),
            lessonId: "l1",
            stepId: "l1-s1",
            userId: "user-1",
          }),
        ])
      } finally {
        reseededClient.close()
      }
    } finally {
      removeTempDirectory(tempDirectory)
    }
  })

  it("seed 데이터에 없는 기존 콘텐츠는 삭제하지 않고 archived 처리한다", async () => {
    const tempDirectory = mkdtempSync(
      join(tmpdir(), "writing-app-seed-archive-")
    )
    const databaseUrl = join(tempDirectory, "api.sqlite")

    try {
      await seedDatabase(databaseUrl)

      const client = createWritingAppDatabase(databaseUrl)

      try {
        client.db
          .insert(courses)
          .values({
            category: "legacy",
            curriculumRevision: 0,
            description: "이전 개발 콘텐츠",
            id: "legacy-course",
            sortOrder: 999,
            status: "active",
            title: "이전 코스",
          })
          .run()
        client.db
          .insert(courseUnits)
          .values({
            courseId: "legacy-course",
            id: "legacy-unit",
            sortOrder: 1,
            status: "active",
            title: "이전 유닛",
          })
          .run()
        client.db
          .insert(lessons)
          .values({
            category: null,
            courseId: "legacy-course",
            description: null,
            estimatedMinutes: 5,
            id: "legacy-lesson",
            sortOrder: 1,
            status: "active",
            summaryJson: "[]",
            title: "이전 레슨",
            unitId: "legacy-unit",
          })
          .run()
        client.db
          .insert(lessonSteps)
          .values({
            contentJson: "{}",
            id: "legacy-step",
            lessonId: "legacy-lesson",
            sortOrder: 1,
            status: "active",
            type: "READING",
          })
          .run()
      } finally {
        client.close()
      }

      await seedDatabase(databaseUrl)

      const reseededClient = createWritingAppDatabase(databaseUrl)

      try {
        expect(
          reseededClient.db
            .select()
            .from(courses)
            .all()
            .find((course) => course.id === "legacy-course")
        ).toEqual(expect.objectContaining({ status: "archived" }))
        expect(
          reseededClient.db
            .select()
            .from(courseUnits)
            .all()
            .find((unit) => unit.id === "legacy-unit")
        ).toEqual(expect.objectContaining({ status: "archived" }))
        expect(
          reseededClient.db
            .select()
            .from(lessons)
            .all()
            .find((lesson) => lesson.id === "legacy-lesson")
        ).toEqual(expect.objectContaining({ status: "archived" }))
        expect(
          reseededClient.db
            .select()
            .from(lessonSteps)
            .all()
            .find((step) => step.id === "legacy-step")
        ).toEqual(expect.objectContaining({ status: "archived" }))
      } finally {
        reseededClient.close()
      }
    } finally {
      removeTempDirectory(tempDirectory)
    }
  })

  it("production에서는 명시적 허용 조건 없이 seed를 실행하지 않는다", async () => {
    const tempDirectory = mkdtempSync(
      join(tmpdir(), "writing-app-production-seed-")
    )
    const databaseUrl = join(tempDirectory, "api.sqlite")

    try {
      await expect(
        seedDatabase({
          databaseUrl,
          nodeEnv: "production",
        })
      ).rejects.toThrow(
        "production DB seed 실행은 ALLOW_DATABASE_RESET=true와 --force가 필요합니다."
      )
    } finally {
      rmSync(tempDirectory, { force: true, recursive: true })
    }
  })

  it("저장소 data 밖의 이전 DB 파일은 명시적 허용 조건이 있어도 재생성하지 않는다", async () => {
    const tempDirectory = mkdtempSync(
      join(tmpdir(), "writing-app-legacy-seed-")
    )
    const databaseUrl = join(tempDirectory, "api.sqlite")
    const legacyClient = new Database(databaseUrl)

    try {
      legacyClient.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE courses (
          id TEXT PRIMARY KEY NOT NULL,
          category_id TEXT,
          title TEXT,
          description TEXT,
          sort_order INTEGER,
          curriculum_revision INTEGER
        );
        CREATE TABLE lessons (
          id TEXT PRIMARY KEY NOT NULL,
          course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          title TEXT,
          category_id TEXT,
          unit_number INTEGER,
          next_lesson_id TEXT
        );
        CREATE TABLE lesson_steps (
          id TEXT PRIMARY KEY NOT NULL,
          lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
          type TEXT,
          sort_order INTEGER,
          points INTEGER,
          required INTEGER,
          content_json TEXT,
          status TEXT
        );
        INSERT INTO courses (id) VALUES ('legacy-course');
        INSERT INTO lessons (id, course_id) VALUES ('legacy-lesson', 'legacy-course');
        INSERT INTO lesson_steps (id, lesson_id) VALUES ('legacy-step', 'legacy-lesson');
      `)
      legacyClient.close()

      await expect(
        seedDatabase({
          allowDatabaseReset: true,
          databaseUrl,
          forceDatabaseReset: true,
        })
      ).rejects.toThrow(
        "저장소 data 디렉터리 밖의 DB 파일은 재생성할 수 없습니다."
      )
    } finally {
      legacyClient.close(false)
      rmSync(tempDirectory, { force: true, recursive: true })
    }
  })

  it("명시적 허용 조건이 없으면 이전 DB 파일을 삭제하지 않는다", async () => {
    const databaseUrl = join(
      fileURLToPath(new URL("../../../../data", import.meta.url)),
      `seed-guard-${crypto.randomUUID()}.sqlite`
    )
    const legacyClient = new Database(databaseUrl)

    try {
      legacyClient.exec(`
        CREATE TABLE courses (
          id TEXT PRIMARY KEY NOT NULL
        );
        INSERT INTO courses (id) VALUES ('legacy-course');
      `)
      legacyClient.close()

      await expect(seedDatabase(databaseUrl)).rejects.toThrow(
        "DB 파일 재생성은 ALLOW_DATABASE_RESET=true와 --force가 필요합니다."
      )

      const existingClient = new Database(databaseUrl, { readonly: true })

      try {
        expect(
          existingClient
            .query<{ readonly id: string }, []>("SELECT id FROM courses")
            .all()
        ).toEqual([{ id: "legacy-course" }])
      } finally {
        existingClient.close()
      }
    } finally {
      legacyClient.close(false)
      removeDatabaseFiles(databaseUrl)
    }
  })

  it("저장소 data 하위 DB는 명시적 허용 조건으로 새 baseline으로 재생성한다", async () => {
    const databaseUrl = join(
      fileURLToPath(new URL("../../../../data", import.meta.url)),
      `seed-reset-${crypto.randomUUID()}.sqlite`
    )
    const legacyClient = new Database(databaseUrl)

    try {
      legacyClient.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE courses (
          id TEXT PRIMARY KEY NOT NULL,
          category_id TEXT,
          title TEXT,
          description TEXT,
          sort_order INTEGER,
          curriculum_revision INTEGER
        );
        CREATE TABLE lessons (
          id TEXT PRIMARY KEY NOT NULL,
          course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          title TEXT,
          category_id TEXT,
          unit_number INTEGER,
          next_lesson_id TEXT
        );
        CREATE TABLE lesson_steps (
          id TEXT PRIMARY KEY NOT NULL,
          lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
          type TEXT,
          sort_order INTEGER,
          points INTEGER,
          required INTEGER,
          content_json TEXT,
          status TEXT
        );
        INSERT INTO courses (id) VALUES ('legacy-course');
        INSERT INTO lessons (id, course_id) VALUES ('legacy-lesson', 'legacy-course');
        INSERT INTO lesson_steps (id, lesson_id) VALUES ('legacy-step', 'legacy-lesson');
      `)
      legacyClient.close()

      await seedDatabase({
        allowDatabaseReset: true,
        databaseUrl,
        forceDatabaseReset: true,
      })

      const client = createWritingAppDatabase(databaseUrl)

      try {
        const courseColumns = client.sqlite
          .query<{ readonly name: string }, []>("PRAGMA table_info(courses)")
          .all()
          .map((row) => row.name)

        expect(courseColumns).toContain("curriculum_revision")
        expect(client.db.select().from(courses).all()).toHaveLength(5)
        expect(client.db.select().from(lessons).all()).toHaveLength(44)
        expect(client.db.select().from(lessonSteps).all()).toHaveLength(136)
      } finally {
        client.close()
      }
    } finally {
      legacyClient.close(false)
      removeDatabaseFiles(databaseUrl)
    }
  })
})

function removeDatabaseFiles(databaseUrl: string): void {
  Bun.gc(true)

  for (const path of [
    databaseUrl,
    `${databaseUrl}-shm`,
    `${databaseUrl}-wal`,
  ]) {
    rmSync(path, {
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    })
  }
}

function removeTempDirectory(tempDirectory: string): void {
  Bun.gc(true)

  rmSync(tempDirectory, {
    force: true,
    maxRetries: 3,
    recursive: true,
    retryDelay: 100,
  })
}
