import { describe, expect, it } from "vitest"

import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"

import { runApplicationMigrations } from "@/db/migrate"
import { seedApplicationDatabase } from "@/db/seed"

describe("application seed composition", () => {
  it("재실행 시 학습자 auth·profile과 학습 기록의 application state를 보존한다", async () => {
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
      database.sqlite.exec(`
        UPDATE user
        SET name = '수정한 학습자', email = 'edited@example.com', updated_at = 7
        WHERE id = 'user-1';
        UPDATE learner_profiles
        SET status = 'suspended', display_name = '수정한 표시 이름', version = 7
        WHERE user_id = 'user-1';
      `)
      const before = {
        auth: database.sqlite
          .query<
            {
              readonly email: string
              readonly name: string
              readonly updatedAt: number
            },
            []
          >(
            "SELECT email, name, updated_at AS updatedAt FROM user WHERE id = 'user-1'"
          )
          .get(),
        profile: database.sqlite
          .query<
            {
              readonly displayName: string
              readonly status: string
              readonly version: number
            },
            []
          >(
            "SELECT display_name AS displayName, status, version FROM learner_profiles WHERE user_id = 'user-1'"
          )
          .get(),
      }

      await seedApplicationDatabase(database)

      expect({
        auth: database.sqlite
          .query<
            {
              readonly email: string
              readonly name: string
              readonly updatedAt: number
            },
            []
          >(
            "SELECT email, name, updated_at AS updatedAt FROM user WHERE id = 'user-1'"
          )
          .get(),
        profile: database.sqlite
          .query<
            {
              readonly displayName: string
              readonly status: string
              readonly version: number
            },
            []
          >(
            "SELECT display_name AS displayName, status, version FROM learner_profiles WHERE user_id = 'user-1'"
          )
          .get(),
      }).toEqual(before)

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

  it("중간 content seed 실패 후 재실행이 누락 aggregate만 채운다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(database.sqlite)
      database.sqlite.exec(`
        CREATE TRIGGER reject_content_seed
        BEFORE INSERT ON courses
        BEGIN SELECT RAISE(ABORT, 'content seed fault injection'); END;
      `)

      await expect(seedApplicationDatabase(database)).rejects.toThrow(
        "content seed fault injection"
      )
      expect(readSeedCounts(database)).toEqual({
        content: 0,
        learnerAuth: 1,
        learnerIdentity: 0,
      })

      database.sqlite.exec("DROP TRIGGER reject_content_seed")
      await seedApplicationDatabase(database)
      const completed = readSeedCounts(database)
      expect(completed.content).toBeGreaterThan(0)
      expect(completed).toMatchObject({
        learnerAuth: 1,
        learnerIdentity: 1,
      })

      await seedApplicationDatabase(database)
      expect(readSeedCounts(database)).toEqual(completed)
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
        "현재 schema era가 선언되지 않은 database"
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

function readSeedCounts(database: WritingAppDatabaseClient): {
  readonly content: number
  readonly learnerAuth: number
  readonly learnerIdentity: number
} {
  const row = database.sqlite
    .query<
      {
        readonly content: number
        readonly learnerAuth: number
        readonly learnerIdentity: number
      },
      []
    >(`
      SELECT
        (SELECT COUNT(*) FROM courses) AS content,
        (SELECT COUNT(*) FROM user WHERE id = 'user-1') AS learnerAuth,
        (
          SELECT COUNT(*) FROM learner_profiles WHERE user_id = 'user-1'
        ) AS learnerIdentity
    `)
    .get()
  if (row === null) throw new Error("seed count fixture가 필요합니다.")
  return row
}
