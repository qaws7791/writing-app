import { describe, expect, it } from "vitest"

import { createInMemoryWritingAppDatabase } from "@workspace/db/client"

import { seedApplicationDatabase } from "@/db/seed"

describe("application seed composition", () => {
  it("auth, content와 identity provider를 순서대로 호출하고 학습 기록을 보존한다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      await seedApplicationDatabase(database)
      const content = database.sqlite
        .query<{ readonly courseId: string; readonly versionId: string }, []>(`
          SELECT course.id AS courseId, version.id AS versionId
          FROM courses AS course
          INNER JOIN course_curriculum_versions AS version
            ON version.course_id = course.id
          WHERE version.status = 'published'
          ORDER BY course.sort_order
          LIMIT 1
        `)
        .get()
      if (content === null) throw new Error("seed content가 필요합니다.")

      database.sqlite
        .query<void, [string, string]>(`
          INSERT INTO learner_course_progress (
            user_id, course_id, curriculum_version_id, status, started_at,
            completed_at, last_activity_at, updated_at
          ) VALUES (
            'user-1', ?, ?, 'in_progress', 1, NULL, 1, 1
          )
        `)
        .run(content.courseId, content.versionId)

      await seedApplicationDatabase(database)

      expect(
        database.sqlite
          .query<{ readonly count: number }, []>(
            "SELECT COUNT(*) AS count FROM learner_course_progress"
          )
          .get()?.count
      ).toBe(1)
      expect(
        database.sqlite
          .query<{ readonly count: number }, []>(
            "SELECT COUNT(*) AS count FROM courses"
          )
          .get()?.count
      ).toBeGreaterThan(0)
      expect(
        database.sqlite
          .query<{ readonly count: number }, []>(
            "SELECT COUNT(*) AS count FROM learner_profiles WHERE user_id = 'user-1'"
          )
          .get()?.count
      ).toBe(1)
    } finally {
      database.close()
    }
  })

  it("지원하지 않는 기존 DB를 삭제하거나 재생성하지 않고 실패한다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      database.sqlite.exec(`
        CREATE TABLE existing_user_data (value TEXT NOT NULL);
        INSERT INTO existing_user_data (value) VALUES ('preserve-me');
      `)

      await expect(seedApplicationDatabase(database)).rejects.toThrow(
        "지원하지 않는 database schema"
      )
      expect(
        database.sqlite
          .query<{ readonly value: string }, []>(
            "SELECT value FROM existing_user_data"
          )
          .get()?.value
      ).toBe("preserve-me")
    } finally {
      database.close()
    }
  })
})
