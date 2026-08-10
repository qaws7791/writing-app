import { and, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"

import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
} from "#content/infrastructure/persistence/schema"
import { seedContentDatabase } from "#content/infrastructure/persistence/seed"

describe("content seed provider", () => {
  it("seed를 재실행해도 기존 aggregate와 seed 밖 활성 course를 보존한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runCurrentTestMigration(client.sqlite)
      await seedContentDatabase(client.db)
      const firstSeedCourseId = requireFixture(
        client.db
          .select({ id: courses.id })
          .from(courses)
          .orderBy(courses.sortOrder)
          .get()?.id,
        "Seed course"
      )
      const publishedVersionId = requireFixture(
        client.db
          .select({ id: courses.publishedCurriculumVersionId })
          .from(courses)
          .where(eq(courses.id, firstSeedCourseId))
          .get()?.id ?? undefined,
        "Published curriculum"
      )
      const draft = requireFixture(
        client.db
          .select()
          .from(courseCurriculumVersions)
          .where(
            and(
              eq(courseCurriculumVersions.courseId, firstSeedCourseId),
              eq(courseCurriculumVersions.status, "draft")
            )
          )
          .get(),
        "Draft curriculum"
      )
      const draftUnit = requireFixture(
        client.db
          .select()
          .from(courseUnitVersions)
          .where(eq(courseUnitVersions.curriculumVersionId, draft.id))
          .get(),
        "Draft unit"
      )

      client.sqlite
        .query<void, []>(
          `INSERT INTO user (
            id, name, email, email_verified, created_at, updated_at
          ) VALUES ('seed-user', '학습자', 'seed@example.test', 1, 1, 1)`
        )
        .run()
      client.sqlite
        .query<void, [string, string]>(
          `INSERT INTO learner_course_progress (
            user_id, course_id, curriculum_version_id,
            status, started_at, last_activity_at, updated_at
          ) VALUES ('seed-user', ?1, ?2, 'in_progress', 1, 1, 1)`
        )
        .run(firstSeedCourseId, publishedVersionId)
      client.sqlite
        .query<void, []>(
          `INSERT INTO courses (
            created_at, id, published_curriculum_version_id, sort_order, status
          ) VALUES (1, 'custom-course', NULL, 999, 'active')`
        )
        .run()
      client.db
        .update(courseCurriculumVersions)
        .set({ editVersion: 7, title: "보존할 draft" })
        .where(eq(courseCurriculumVersions.id, draft.id))
        .run()
      client.db
        .update(courseUnitVersions)
        .set({ title: "보존할 draft unit" })
        .where(
          and(
            eq(courseUnitVersions.curriculumVersionId, draft.id),
            eq(courseUnitVersions.id, draftUnit.id)
          )
        )
        .run()
      const before = readPreservedRows(client, {
        draftId: draft.id,
        draftUnitId: draftUnit.id,
      })

      await seedContentDatabase(client.db)

      expect({
        preservedRows: readPreservedRows(client, {
          draftId: draft.id,
          draftUnitId: draftUnit.id,
        }),
        progressCount: client.sqlite
          .query<{ readonly count: number }, []>(
            "SELECT COUNT(*) AS count FROM learner_course_progress WHERE user_id = 'seed-user'"
          )
          .get()?.count,
        publishedVersionId: client.db
          .select({ id: courses.publishedCurriculumVersionId })
          .from(courses)
          .where(eq(courses.id, firstSeedCourseId))
          .get()?.id,
      }).toEqual({
        preservedRows: before,
        progressCount: 1,
        publishedVersionId,
      })
    } finally {
      client.close()
    }
  })
})

function readPreservedRows(
  client: ReturnType<typeof createInMemoryWritingAppDatabase>,
  input: Readonly<{ draftId: string; draftUnitId: string }>
) {
  return {
    customCourse: client.db
      .select()
      .from(courses)
      .where(eq(courses.id, "custom-course"))
      .get(),
    draft: client.db
      .select()
      .from(courseCurriculumVersions)
      .where(eq(courseCurriculumVersions.id, input.draftId))
      .get(),
    draftUnit: client.db
      .select()
      .from(courseUnitVersions)
      .where(
        and(
          eq(courseUnitVersions.curriculumVersionId, input.draftId),
          eq(courseUnitVersions.id, input.draftUnitId)
        )
      )
      .get(),
  }
}

function requireFixture<T>(value: T | undefined, name: string): T {
  if (value === undefined) throw new Error(`${name} fixture was not found`)
  return value
}
