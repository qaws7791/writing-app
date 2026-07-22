import { and, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { createWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

import {
  courseCurriculumVersions,
  courses,
  lessonStepVersions,
  lessonVersions,
} from "#content/infrastructure/persistence/schema"
import { seedContentDatabase } from "#content/infrastructure/persistence/seed"

describe("content seed provider", () => {
  it("발행본과 다음 draft를 module-owned seed로 삽입한다", async () => {
    const client = createWritingAppDatabase(":memory:")

    try {
      runBaselineMigration(client.sqlite)
      await seedContentDatabase(client.db)

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
    } finally {
      client.close()
    }
  })

  it("재실행 시 published revision과 학습자 고정을 보존하고 draft만 교체한다", async () => {
    const client = createWritingAppDatabase(":memory:")

    try {
      runBaselineMigration(client.sqlite)
      await seedContentDatabase(client.db)
      const publishedVersionId = client.db
        .select({ id: courses.publishedCurriculumVersionId })
        .from(courses)
        .where(eq(courses.id, "c1"))
        .get()?.id
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
      if (publishedVersionId === null || publishedVersionId === undefined) {
        throw new Error("published content fixture가 필요합니다.")
      }
      if (draft === undefined) throw new Error("draft fixture가 필요합니다.")

      client.sqlite.exec(`
        INSERT INTO user (
          id, name, email, email_verified, created_at, updated_at
        ) VALUES ('seed-user', '학습자', 'seed@example.com', 1, 1, 1);
        INSERT INTO learner_course_progress (
          user_id, course_id, curriculum_version_id,
          status, started_at, last_activity_at, updated_at
        ) VALUES (
          'seed-user', 'c1', '${publishedVersionId}',
          'in_progress', 1, 1, 1
        );
      `)
      client.db
        .update(courseCurriculumVersions)
        .set({ title: "교체될 draft" })
        .where(eq(courseCurriculumVersions.id, draft.id))
        .run()

      await seedContentDatabase(client.db)

      expect(
        client.db
          .select({ id: courses.publishedCurriculumVersionId })
          .from(courses)
          .where(eq(courses.id, "c1"))
          .get()?.id
      ).toBe(publishedVersionId)
      expect(
        client.sqlite
          .query<{ readonly count: number }, []>(
            "SELECT COUNT(*) AS count FROM learner_course_progress WHERE user_id = 'seed-user'"
          )
          .get()?.count
      ).toBe(1)
      expect(
        client.db
          .select()
          .from(courseCurriculumVersions)
          .where(
            and(
              eq(courseCurriculumVersions.courseId, "c1"),
              eq(courseCurriculumVersions.status, "draft")
            )
          )
          .all()
      ).toHaveLength(1)
    } finally {
      client.close()
    }
  })
})
