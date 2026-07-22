import { mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { Database } from "bun:sqlite"

import { and, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { createWritingAppDatabase } from "#db/client"
import { inspectDatabaseResetTarget } from "#db/destructive-operation-guard"
import {
  authUsers,
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  learnerCourseProgress,
  learnerLessonAnswers,
  learnerLessonProgress,
  learnerProfiles,
  lessonStepVersions,
  lessonVersions,
} from "#db/schema"
import { seedDatabase } from "#db/seeds/seed"

describe("개발 DB seed 실행", () => {
  it("baseline migration을 적용하고 발행본과 다음 초안을 삽입한다", async () => {
    const fixture = await createSeededDatabase("writing-app-seed-")

    try {
      const client = createWritingAppDatabase(fixture.databaseUrl)

      try {
        expect(client.db.select().from(courses).all()).toHaveLength(5)
        expect(
          client.db.select().from(courseCurriculumVersions).all()
        ).toHaveLength(10)
        expect(
          client.db
            .select()
            .from(courseCurriculumVersions)
            .where(eq(courseCurriculumVersions.status, "published"))
            .all()
        ).toHaveLength(5)
        expect(
          client.db
            .select()
            .from(courseCurriculumVersions)
            .where(eq(courseCurriculumVersions.status, "draft"))
            .all()
        ).toHaveLength(5)
        expect(client.db.select().from(lessonVersions).all()).toHaveLength(88)
        expect(client.db.select().from(lessonStepVersions).all()).toHaveLength(
          272
        )
        expect(client.db.select().from(authUsers).all()).toMatchObject([
          {
            email: "learner@example.com",
            id: "user-1",
            name: "글쓰기 탐험가",
          },
        ])
        expect(client.db.select().from(learnerProfiles).all()).toMatchObject([
          {
            displayName: "글쓰기 탐험가",
            status: "active",
            userId: "user-1",
          },
        ])
      } finally {
        client.close()
      }
    } finally {
      removeTempDirectory(fixture.tempDirectory)
    }
  })

  it("seed 재실행 시 발행본과 학습 기록을 보존하고 초안만 갱신한다", async () => {
    const fixture = await createSeededDatabase("writing-app-seed-preserve-")
    const client = createWritingAppDatabase(fixture.databaseUrl)

    try {
      const now = new Date("2026-06-15T00:00:00.000Z")
      const course = client.db
        .select()
        .from(courses)
        .where(eq(courses.id, "c1"))
        .get()
      const publishedVersionId = course?.publishedCurriculumVersionId
      const draft = client.db
        .select()
        .from(courseCurriculumVersions)
        .where(
          and(
            eq(courseCurriculumVersions.courseId, "c1"),
            eq(courseCurriculumVersions.status, "draft")
          )
        )
        .get()

      expect(publishedVersionId).toBeTruthy()
      expect(draft).toBeDefined()
      if (
        publishedVersionId === null ||
        publishedVersionId === undefined ||
        draft === undefined
      ) {
        throw new Error("테스트 코스 버전을 찾을 수 없습니다.")
      }

      client.db
        .insert(learnerCourseProgress)
        .values({
          courseId: "c1",
          curriculumVersionId: publishedVersionId,
          lastActivityAt: now,
          startedAt: now,
          status: "in_progress",
          updatedAt: now,
          userId: "user-1",
        })
        .run()
      client.db
        .insert(learnerLessonProgress)
        .values({
          completedAt: now,
          courseId: "c1",
          currentStepId: "l1-s1",
          curriculumVersionId: publishedVersionId,
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
          courseId: "c1",
          curriculumVersionId: publishedVersionId,
          lessonId: "l1",
          stepId: "l1-s1",
          updatedAt: now,
          userId: "user-1",
        })
        .run()
      client.db
        .update(lessonVersions)
        .set({ description: "변경된 초안", summaryJson: "[]" })
        .where(
          and(
            eq(lessonVersions.curriculumVersionId, draft.id),
            eq(lessonVersions.id, "l-new")
          )
        )
        .run()
    } finally {
      client.close()
    }

    try {
      await seedDatabase(fixture.databaseUrl)
      const reseededClient = createWritingAppDatabase(fixture.databaseUrl)

      try {
        const course = reseededClient.db
          .select()
          .from(courses)
          .where(eq(courses.id, "c1"))
          .get()
        const draft = reseededClient.db
          .select()
          .from(courseCurriculumVersions)
          .where(
            and(
              eq(courseCurriculumVersions.courseId, "c1"),
              eq(courseCurriculumVersions.status, "draft")
            )
          )
          .get()

        expect(course?.publishedCurriculumVersionId).toBeTruthy()
        expect(
          reseededClient.db.select().from(learnerCourseProgress).all()
        ).toEqual([
          expect.objectContaining({
            courseId: "c1",
            curriculumVersionId: course?.publishedCurriculumVersionId,
            userId: "user-1",
          }),
        ])
        expect(
          reseededClient.db.select().from(learnerLessonProgress).all()
        ).toEqual([
          expect.objectContaining({ currentStepId: "l1-s1", lessonId: "l1" }),
        ])
        expect(
          reseededClient.db.select().from(learnerLessonAnswers).all()
        ).toEqual([
          expect.objectContaining({ lessonId: "l1", stepId: "l1-s1" }),
        ])
        expect(
          reseededClient.db
            .select()
            .from(lessonVersions)
            .where(
              and(
                eq(lessonVersions.curriculumVersionId, draft?.id ?? "missing"),
                eq(lessonVersions.id, "l-new")
              )
            )
            .get()?.description
        ).toBe("매칭·분류·계획·교정 네 가지 활동을 차례로 체험해보세요.")
      } finally {
        reseededClient.close()
      }
    } finally {
      removeTempDirectory(fixture.tempDirectory)
    }
  })

  it("seed 데이터 밖 코스는 보관하되 버전과 학습자 고정은 보존한다", async () => {
    const fixture = await createSeededDatabase("writing-app-seed-archive-")
    const client = createWritingAppDatabase(fixture.databaseUrl)

    try {
      const now = new Date("2026-07-17T00:00:00.000Z")
      client.db
        .insert(courses)
        .values({ createdAt: now, id: "legacy-course", sortOrder: 999 })
        .run()
      client.db
        .insert(courseCurriculumVersions)
        .values({
          category: "legacy",
          courseId: "legacy-course",
          createdAt: now,
          description: "이전 콘텐츠",
          id: "legacy-course-v1",
          revision: 1,
          status: "draft",
          title: "이전 코스",
          updatedAt: now,
          visualKey: "basic-sentence-writing",
        })
        .run()
      client.db
        .insert(courseUnitVersions)
        .values({
          curriculumVersionId: "legacy-course-v1",
          id: "legacy-unit",
          sortOrder: 1,
          title: "이전 유닛",
        })
        .run()
      client.db
        .insert(lessonVersions)
        .values({
          curriculumVersionId: "legacy-course-v1",
          estimatedMinutes: 5,
          id: "legacy-lesson",
          sortOrder: 1,
          summaryJson: "[]",
          title: "이전 레슨",
          unitId: "legacy-unit",
        })
        .run()
      client.db
        .insert(lessonStepVersions)
        .values({
          contentJson: "{}",
          curriculumVersionId: "legacy-course-v1",
          id: "legacy-step",
          lessonId: "legacy-lesson",
          sortOrder: 1,
          type: "READING",
        })
        .run()
      client.db
        .update(courseCurriculumVersions)
        .set({ publishedAt: now, status: "published" })
        .where(eq(courseCurriculumVersions.id, "legacy-course-v1"))
        .run()
      client.db
        .update(courses)
        .set({ publishedCurriculumVersionId: "legacy-course-v1" })
        .where(eq(courses.id, "legacy-course"))
        .run()
      client.db
        .insert(learnerCourseProgress)
        .values({
          courseId: "legacy-course",
          curriculumVersionId: "legacy-course-v1",
          lastActivityAt: now,
          startedAt: now,
          updatedAt: now,
          userId: "user-1",
        })
        .run()
    } finally {
      client.close()
    }

    try {
      await seedDatabase(fixture.databaseUrl)
      const reseededClient = createWritingAppDatabase(fixture.databaseUrl)

      try {
        expect(
          reseededClient.db
            .select()
            .from(courses)
            .where(eq(courses.id, "legacy-course"))
            .get()
        ).toEqual(expect.objectContaining({ status: "archived" }))
        expect(
          reseededClient.db
            .select()
            .from(courseCurriculumVersions)
            .where(eq(courseCurriculumVersions.id, "legacy-course-v1"))
            .get()
        ).toEqual(expect.objectContaining({ status: "published" }))
        expect(
          reseededClient.db
            .select()
            .from(learnerCourseProgress)
            .where(eq(learnerCourseProgress.courseId, "legacy-course"))
            .get()
        ).toEqual(
          expect.objectContaining({ curriculumVersionId: "legacy-course-v1" })
        )
      } finally {
        reseededClient.close()
      }
    } finally {
      removeTempDirectory(fixture.tempDirectory)
    }
  })

  it("production에서는 명시적 허용 조건 없이 seed를 실행하지 않는다", async () => {
    const tempDirectory = mkdtempSync(
      join(tmpdir(), "writing-app-production-seed-")
    )
    const databaseUrl = join(tempDirectory, "api.sqlite")

    try {
      await expect(
        seedDatabase({ databaseUrl, nodeEnv: "production" })
      ).rejects.toThrow(
        "저장소 data 디렉터리 밖의 DB 파일은 초기화할 수 없습니다."
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
      legacyClient.exec(
        "CREATE TABLE courses (id TEXT PRIMARY KEY NOT NULL); INSERT INTO courses (id) VALUES ('legacy-course');"
      )
      legacyClient.close()

      await expect(
        seedDatabase({
          allowDatabaseReset: true,
          databaseUrl,
          forceDatabaseReset: true,
        })
      ).rejects.toThrow(
        "저장소 data 디렉터리 밖의 DB 파일은 초기화할 수 없습니다."
      )
    } finally {
      legacyClient.close(false)
      rmSync(tempDirectory, { force: true, recursive: true })
    }
  })

  it("명시적 허용 조건이 없으면 이전 DB 파일을 삭제하지 않는다", async () => {
    mkdirSync(fileURLToPath(new URL("../../../../../data", import.meta.url)), {
      recursive: true,
    })
    const databaseUrl = join(
      fileURLToPath(new URL("../../../../../data", import.meta.url)),
      `seed-guard-${crypto.randomUUID()}.sqlite`
    )
    const legacyClient = new Database(databaseUrl)

    try {
      legacyClient.exec(
        "CREATE TABLE courses (id TEXT PRIMARY KEY NOT NULL); INSERT INTO courses (id) VALUES ('legacy-course');"
      )
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
    mkdirSync(fileURLToPath(new URL("../../../../../data", import.meta.url)), {
      recursive: true,
    })
    const databaseUrl = join(
      fileURLToPath(new URL("../../../../../data", import.meta.url)),
      `seed-reset-${crypto.randomUUID()}.sqlite`
    )
    const legacyClient = new Database(databaseUrl)
    let backupDirectory: string | undefined

    try {
      legacyClient.exec(
        "CREATE TABLE courses (id TEXT PRIMARY KEY NOT NULL); INSERT INTO courses (id) VALUES ('legacy-course');"
      )
      legacyClient.close()
      const resetTarget = inspectDatabaseResetTarget(databaseUrl)
      if (resetTarget === null)
        throw new Error("파일 DB reset 대상이 필요합니다.")
      backupDirectory = resetTarget.backupDirectory
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
        expect(courseColumns).toContain("published_curriculum_version_id")
        expect(client.db.select().from(courses).all()).toHaveLength(5)
        expect(client.db.select().from(lessonVersions).all()).toHaveLength(88)
        expect(client.db.select().from(lessonStepVersions).all()).toHaveLength(
          272
        )
      } finally {
        client.close()
      }
    } finally {
      legacyClient.close(false)
      removeDatabaseFiles(databaseUrl)
      if (backupDirectory !== undefined) {
        rmSync(backupDirectory, { force: true, recursive: true })
      }
    }
  })
})

async function createSeededDatabase(
  prefix: string
): Promise<{ readonly databaseUrl: string; readonly tempDirectory: string }> {
  const tempDirectory = mkdtempSync(join(tmpdir(), prefix))
  const databaseUrl = join(tempDirectory, "api.sqlite")
  await seedDatabase(databaseUrl)
  return { databaseUrl, tempDirectory }
}

function removeDatabaseFiles(databaseUrl: string): void {
  Bun.gc(true)
  for (const path of [
    databaseUrl,
    `${databaseUrl}-shm`,
    `${databaseUrl}-wal`,
  ]) {
    rmSync(path, { force: true, maxRetries: 3, retryDelay: 100 })
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
