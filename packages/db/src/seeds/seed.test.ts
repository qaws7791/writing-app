import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Database } from "bun:sqlite"

import { describe, expect, it } from "vitest"

import { createKwepDatabase } from "@/client"
import {
  authUsers,
  courses,
  learnerLessonAnswers,
  learnerLessonProgress,
  learnerProfiles,
  lessons,
  lessonSteps,
} from "@/schema"
import { seedDatabase } from "@/seeds/seed"

describe("개발 DB seed 실행", () => {
  it("baseline migration을 적용하고 Kwep 콘텐츠를 삽입한다", async () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), "kwep-seed-"))
    const databaseUrl = join(tempDirectory, "api.sqlite")

    try {
      await seedDatabase(databaseUrl)

      const client = createKwepDatabase(databaseUrl)

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
    const tempDirectory = mkdtempSync(join(tmpdir(), "kwep-seed-preserve-"))
    const databaseUrl = join(tempDirectory, "api.sqlite")

    try {
      await seedDatabase(databaseUrl)

      const client = createKwepDatabase(databaseUrl)

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

      const reseededClient = createKwepDatabase(databaseUrl)

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

  it("이전 개발 DB 스키마가 남아 있으면 새 baseline으로 재생성한다", async () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), "kwep-legacy-seed-"))
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

      await seedDatabase(databaseUrl)

      const client = createKwepDatabase(databaseUrl)

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
      removeTempDirectory(tempDirectory)
    }
  })
})

function removeTempDirectory(tempDirectory: string): void {
  Bun.gc(true)

  rmSync(tempDirectory, {
    force: true,
    maxRetries: 3,
    recursive: true,
    retryDelay: 100,
  })
}
