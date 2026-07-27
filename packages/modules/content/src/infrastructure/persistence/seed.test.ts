import { and, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { createWritingAppDatabase } from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"

import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonStepVersions,
  lessonVersions,
} from "#content/infrastructure/persistence/schema"
import { seedContentDatabase } from "#content/infrastructure/persistence/seed"

describe("content seed provider", () => {
  it("발행본과 다음 draft를 module-owned seed로 삽입한다", async () => {
    const client = createWritingAppDatabase(":memory:")

    try {
      runCurrentTestMigration(client.sqlite)
      await seedContentDatabase(client.db)

      expect(client.db.select().from(courses).all()).toHaveLength(14)
      expect(
        client.db.select().from(courseCurriculumVersions).all()
      ).toHaveLength(28)
      expect(
        client.db
          .select()
          .from(courseCurriculumVersions)
          .where(eq(courseCurriculumVersions.status, "published"))
          .all()
      ).toHaveLength(14)
      expect(
        client.db
          .select()
          .from(courseCurriculumVersions)
          .where(eq(courseCurriculumVersions.status, "draft"))
          .all()
      ).toHaveLength(14)
      expect(client.db.select().from(lessonVersions).all()).toHaveLength(642)
      expect(client.db.select().from(lessonStepVersions).all()).toHaveLength(
        1662
      )
    } finally {
      client.close()
    }
  })

  it("재실행 시 기존 aggregate와 seed 밖 활성 course를 그대로 보존한다", async () => {
    const client = createWritingAppDatabase(":memory:")

    try {
      runCurrentTestMigration(client.sqlite)
      await seedContentDatabase(client.db)
      const firstSeedCourseId = client.db
        .select({ id: courses.id })
        .from(courses)
        .orderBy(courses.sortOrder)
        .get()?.id
      if (firstSeedCourseId === undefined) {
        throw new Error("첫 seed course fixture가 필요합니다.")
      }
      const publishedVersionId = client.db
        .select({ id: courses.publishedCurriculumVersionId })
        .from(courses)
        .where(eq(courses.id, firstSeedCourseId))
        .get()?.id
      const draft = client.db
        .select()
        .from(courseCurriculumVersions)
        .where(
          and(
            eq(courseCurriculumVersions.courseId, firstSeedCourseId),
            eq(courseCurriculumVersions.status, "draft")
          )
        )
        .get()
      if (publishedVersionId === null || publishedVersionId === undefined) {
        throw new Error("published content fixture가 필요합니다.")
      }
      if (draft === undefined) throw new Error("draft fixture가 필요합니다.")
      const draftUnit = client.db
        .select()
        .from(courseUnitVersions)
        .where(eq(courseUnitVersions.curriculumVersionId, draft.id))
        .get()
      if (draftUnit === undefined)
        throw new Error("draft unit fixture가 필요합니다.")

      client.sqlite.exec(`
        INSERT INTO user (
          id, name, email, email_verified, created_at, updated_at
        ) VALUES ('seed-user', '학습자', 'seed@example.com', 1, 1, 1);
        INSERT INTO learner_course_progress (
          user_id, course_id, curriculum_version_id,
          status, started_at, last_activity_at, updated_at
        ) VALUES (
          'seed-user', '${firstSeedCourseId}', '${publishedVersionId}',
          'in_progress', 1, 1, 1
        );
        INSERT INTO courses (
          created_at, id, published_curriculum_version_id, sort_order, status
        ) VALUES (1, 'custom-course', NULL, 999, 'active');
      `)
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
      const before = {
        customCourse: client.db
          .select()
          .from(courses)
          .where(eq(courses.id, "custom-course"))
          .get(),
        draft: client.db
          .select()
          .from(courseCurriculumVersions)
          .where(eq(courseCurriculumVersions.id, draft.id))
          .get(),
        draftUnit: client.db
          .select()
          .from(courseUnitVersions)
          .where(
            and(
              eq(courseUnitVersions.curriculumVersionId, draft.id),
              eq(courseUnitVersions.id, draftUnit.id)
            )
          )
          .get(),
      }

      await seedContentDatabase(client.db)

      expect(
        client.db
          .select({ id: courses.publishedCurriculumVersionId })
          .from(courses)
          .where(eq(courses.id, firstSeedCourseId))
          .get()?.id
      ).toBe(publishedVersionId)
      expect(
        client.sqlite
          .query<{ readonly count: number }, []>(
            "SELECT COUNT(*) AS count FROM learner_course_progress WHERE user_id = 'seed-user'"
          )
          .get()?.count
      ).toBe(1)
      expect({
        customCourse: client.db
          .select()
          .from(courses)
          .where(eq(courses.id, "custom-course"))
          .get(),
        draft: client.db
          .select()
          .from(courseCurriculumVersions)
          .where(eq(courseCurriculumVersions.id, draft.id))
          .get(),
        draftUnit: client.db
          .select()
          .from(courseUnitVersions)
          .where(
            and(
              eq(courseUnitVersions.curriculumVersionId, draft.id),
              eq(courseUnitVersions.id, draftUnit.id)
            )
          )
          .get(),
      }).toEqual(before)
    } finally {
      client.close()
    }
  })
})
