import { describe, expect, it } from "vitest"
import { createWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

import {
  toCourseId,
  toLessonId,
  toLessonStepId,
  toUnitId,
} from "@/adapters/content/admin-content-ids"
import { createAdminCourseRepository } from "@/adapters/content/admin-course-drizzle.repository"

describe("통합 API 소유 관리자 content repository", () => {
  it("app-local adapter가 course draft를 생성하고 editor로 다시 읽는다", async () => {
    const databaseClient = createWritingAppDatabase(":memory:")
    const now = new Date("2026-06-14T03:00:00.000Z")

    try {
      runBaselineMigration(databaseClient.sqlite)
      const repository = createAdminCourseRepository(databaseClient.db, {
        createCourseContentIds: () => ({
          courseId: toCourseId("target-course-1"),
          lessonId: toLessonId("target-course-1-lesson-1"),
          readingStepId: toLessonStepId("target-course-1-step-reading"),
          unitId: toUnitId("target-course-1-unit-1"),
          writeStepId: toLessonStepId("target-course-1-step-write"),
        }),
      })

      const created = await repository.createCourse({ now })
      const editor = await repository.readCourseEditor({
        courseId: created.id,
      })

      expect(created).toMatchObject({
        editVersion: 0,
        id: "target-course-1",
        revision: 1,
        status: "active",
      })
      expect(editor).toMatchObject({
        curriculumVersionId: created.curriculumVersionId,
        editVersion: 0,
        id: created.id,
        units: [],
      })
    } finally {
      databaseClient.close()
    }
  })
})
