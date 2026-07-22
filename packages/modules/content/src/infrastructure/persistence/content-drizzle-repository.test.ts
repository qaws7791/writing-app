import { Database } from "bun:sqlite"
import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { createWritingAppDatabase } from "@workspace/db/client"
import { runBaselineTestMigration } from "@workspace/db/test-support/application-migration"

import {
  createCourseId,
  createCurriculumVersionId,
  readLessonId,
  readLessonStepId,
  readUnitId,
  type CurriculumDraft,
} from "#content/domain/content-model"
import { decidePublishCurriculum } from "#content/domain/curriculum"
import { createDrizzleContentRepository } from "#content/infrastructure/persistence/content-drizzle-repository"
import { courseCurriculumVersions } from "#content/infrastructure/persistence/schema"
import {
  assertContentMigrationPrerequisites,
  runContentSchemaMigration,
} from "#content/infrastructure/persistence/schema-migration"

const now = new Date("2026-07-22T03:00:00.000Z")
const courseId = createCourseId("content-course-1")

describe("content Drizzle repository", () => {
  it("course마다 draft 하나만 DB partial unique index로 허용한다", async () => {
    const fixture = createRepositoryFixture()

    try {
      await fixture.repository.createCourse({ courseId, now })

      expect(() =>
        fixture.databaseClient.db
          .insert(courseCurriculumVersions)
          .values({
            category: "미분류",
            courseId,
            createdAt: now,
            description: "중복 draft",
            editVersion: 0,
            id: createCurriculumVersionId(courseId, 2),
            publishedAt: null,
            revision: 2,
            status: "draft",
            title: "중복 draft",
            updatedAt: now,
            visualKey: "basic-sentence-writing",
          })
          .run()
      ).toThrow(/UNIQUE constraint failed/u)
    } finally {
      fixture.databaseClient.close()
    }
  })

  it("optimistic conflict를 Result로 반환하고 이전 draft를 보존한다", async () => {
    const fixture = createRepositoryFixture()

    try {
      await fixture.repository.createCourse({ courseId, now })
      const draft = await readDraftOrThrow(fixture.repository)
      const first = await fixture.repository.saveDraft({
        draft: completeDraft(draft),
        expectedEditVersion: 0,
        now,
      })
      const stale = await fixture.repository.saveDraft({
        draft: completeDraft(draft),
        expectedEditVersion: 0,
        now,
      })

      expect(first.isOk() && first.value.editVersion).toBe(1)
      expect(stale.isErr() && stale.error).toEqual({
        kind: "content-conflict",
      })
      expect((await readDraftOrThrow(fixture.repository)).editVersion).toBe(1)
    } finally {
      fixture.databaseClient.close()
    }
  })

  it("publish를 원자적으로 commit하고 published revision을 trigger로 불변화한다", async () => {
    const fixture = createRepositoryFixture()

    try {
      await fixture.repository.createCourse({ courseId, now })
      const initial = await readDraftOrThrow(fixture.repository)
      const saved = await fixture.repository.saveDraft({
        draft: completeDraft(initial),
        expectedEditVersion: 0,
        now,
      })
      if (saved.isErr()) throw new Error(saved.error.kind)
      const decision = decidePublishCurriculum({
        draft: saved.value,
        eventId: "content-event-1",
        now,
      })
      if (decision.isErr()) throw new Error(decision.error.kind)

      const published = await fixture.repository.publishDraft({
        decision: decision.value,
        expectedEditVersion: 1,
        nextDraftId: createCurriculumVersionId(courseId, 2),
      })

      expect(published.isOk() && published.value.revision).toBe(1)
      expect((await readDraftOrThrow(fixture.repository)).revision).toBe(2)
      expect(() =>
        fixture.databaseClient.db
          .update(courseCurriculumVersions)
          .set({ title: "변경 금지" })
          .where(
            eq(
              courseCurriculumVersions.id,
              createCurriculumVersionId(courseId, 1)
            )
          )
          .run()
      ).toThrow(/published curriculum version is immutable/u)
    } finally {
      fixture.databaseClient.close()
    }
  })

  it("publish transaction 실패 시 기존 draft 상태까지 rollback한다", async () => {
    const fixture = createRepositoryFixture()

    try {
      await fixture.repository.createCourse({ courseId, now })
      const initial = await readDraftOrThrow(fixture.repository)
      const saved = await fixture.repository.saveDraft({
        draft: completeDraft(initial),
        expectedEditVersion: 0,
        now,
      })
      if (saved.isErr()) throw new Error(saved.error.kind)
      const decision = decidePublishCurriculum({
        draft: saved.value,
        eventId: "content-event-1",
        now,
      })
      if (decision.isErr()) throw new Error(decision.error.kind)

      await expect(
        fixture.repository.publishDraft({
          decision: decision.value,
          expectedEditVersion: 1,
          nextDraftId: saved.value.curriculumVersionId,
        })
      ).rejects.toThrow(/UNIQUE constraint failed/u)

      const draft = await readDraftOrThrow(fixture.repository)
      expect(draft.curriculumVersionId).toBe(saved.value.curriculumVersionId)
      expect(
        fixture.databaseClient.db
          .select({ publishedAt: courseCurriculumVersions.publishedAt })
          .from(courseCurriculumVersions)
          .where(
            eq(courseCurriculumVersions.id, saved.value.curriculumVersionId)
          )
          .get()?.publishedAt
      ).toBeNull()
    } finally {
      fixture.databaseClient.close()
    }
  })

  it("archive가 새 조회만 숨기고 명시적으로 고정된 published revision은 보존한다", async () => {
    const fixture = createRepositoryFixture()

    try {
      await fixture.repository.createCourse({ courseId, now })
      const draft = await readDraftOrThrow(fixture.repository)
      const saved = await fixture.repository.saveDraft({
        draft: completeDraft(draft),
        expectedEditVersion: 0,
        now,
      })
      if (saved.isErr()) throw new Error(saved.error.kind)
      const decision = decidePublishCurriculum({
        draft: saved.value,
        eventId: "content-event-1",
        now,
      })
      if (decision.isErr()) throw new Error(decision.error.kind)
      await fixture.repository.publishDraft({
        decision: decision.value,
        expectedEditVersion: 1,
        nextDraftId: createCurriculumVersionId(courseId, 2),
      })
      const course = await fixture.repository.findCourse(courseId)
      if (course === null) throw new Error("course not found")
      await fixture.repository.saveCourse({
        course: { ...course, status: "archived" },
        expectedStatus: "active",
      })

      expect(await fixture.repository.readCurriculum({ courseId })).toBeNull()
      expect(
        await fixture.repository.readCurriculum({
          courseId,
          curriculumVersionId: saved.value.curriculumVersionId,
        })
      ).toMatchObject({ revision: 1, title: saved.value.title })
    } finally {
      fixture.databaseClient.close()
    }
  })
})

describe("content migration prerequisites", () => {
  it("module schema migration이 published 불변 trigger를 소유하고 복구한다", () => {
    const sqlite = new Database(":memory:")

    try {
      runBaselineTestMigration(sqlite)
      sqlite.exec(
        "DROP TRIGGER course_curriculum_versions_published_update_guard"
      )

      runContentSchemaMigration(sqlite)

      expect(
        sqlite
          .query<{ readonly name: string }, []>(
            "SELECT name FROM sqlite_master WHERE type = 'trigger' AND name = 'course_curriculum_versions_published_update_guard'"
          )
          .get()
      ).toEqual({
        name: "course_curriculum_versions_published_update_guard",
      })
    } finally {
      sqlite.close()
    }
  })

  it("중복 draft가 있으면 migration을 fail-closed한다", () => {
    const sqlite = new Database(":memory:")

    try {
      runBaselineTestMigration(sqlite)
      sqlite.exec(`
        DROP INDEX course_curriculum_versions_single_draft_idx;
        INSERT INTO courses VALUES ('duplicate-course', 'active', 1, NULL, 1);
        INSERT INTO course_curriculum_versions VALUES (
          'curriculum:duplicate-course:1', 'duplicate-course', 1, 0,
          'draft', '코스', '설명', '기초', 'basic-sentence-writing',
          1, 1, NULL
        );
        INSERT INTO course_curriculum_versions VALUES (
          'curriculum:duplicate-course:2', 'duplicate-course', 2, 0,
          'draft', '코스', '설명', '기초', 'basic-sentence-writing',
          1, 1, NULL
        );
      `)

      expect(() => assertContentMigrationPrerequisites(sqlite)).toThrow(
        /multiple drafts for duplicate-course/u
      )
    } finally {
      sqlite.close()
    }
  })

  it("cross-module orphan reference가 있으면 migration을 fail-closed한다", () => {
    const sqlite = new Database(":memory:")

    try {
      runBaselineTestMigration(sqlite)
      sqlite.exec("PRAGMA foreign_keys = OFF")
      sqlite.exec(`
        INSERT INTO learner_course_progress (
          user_id,
          course_id,
          curriculum_version_id,
          started_at,
          last_activity_at,
          status,
          updated_at
        ) VALUES (
          'orphan-user',
          'orphan-course',
          'orphan-version',
          1,
          1,
          'in_progress',
          1
        )
      `)

      expect(() => assertContentMigrationPrerequisites(sqlite)).toThrow(
        /orphan learner course reference/u
      )
    } finally {
      sqlite.close()
    }
  })
})

function createRepositoryFixture() {
  const databaseClient = createWritingAppDatabase(":memory:")
  runBaselineTestMigration(databaseClient.sqlite)
  runContentSchemaMigration(databaseClient.sqlite)
  return {
    databaseClient,
    repository: createDrizzleContentRepository(databaseClient.db),
  }
}

async function readDraftOrThrow(
  repository: ReturnType<typeof createDrizzleContentRepository>
): Promise<CurriculumDraft> {
  const draft = await repository.findDraft(courseId)
  if (draft.isErr()) throw new Error(draft.error.kind)
  if (draft.value === null) throw new Error("draft not found")
  return draft.value
}

function completeDraft(draft: CurriculumDraft): CurriculumDraft {
  return {
    ...draft,
    units: [
      {
        id: readUnitId("content-unit-1"),
        lessons: [
          {
            category: "기초",
            description: "설명",
            estimatedMinutes: 5,
            id: readLessonId("content-lesson-1"),
            sortOrder: 1,
            status: "active",
            steps: [
              {
                contentJson: JSON.stringify({
                  body: "본문",
                  guide: "",
                  title: "읽기",
                  type: "reading",
                }),
                id: readLessonStepId("content-step-1"),
                sortOrder: 1,
                status: "active",
                type: "READING",
              },
            ],
            summary: [],
            title: "레슨",
          },
        ],
        sortOrder: 1,
        status: "active",
        title: "유닛",
      },
    ],
  }
}
