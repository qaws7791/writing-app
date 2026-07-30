import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"
import { lessonStepTypeValues } from "@workspace/contracts/content/steps"
import { createWritingAppDatabase } from "@workspace/db/client"

import { requiredApplicationBackupTableNames } from "@/db/required-application-tables"
import { setupE2eContentDatabase } from "@/test-support/setup-e2e-content-database"
import { setupE2eAuthDatabase } from "@/test-support/setup-e2e-database"

// 실제 콘텐츠 seed와 credential 해싱을 수행하는 suite이므로, 저장소 전체 병렬
// 실행에서 CPU가 포화될 때 기본 5초 timeout을 넘긴다.
describe("E2E database setup", { timeout: 20_000 }, () => {
  it("현재 baseline에 owner·learner credential과 정규 활동 유형 전체를 준비한다", async () => {
    const directory = mkdtempSync(join(tmpdir(), "writing-app-e2e-setup-"))
    const databasePath = join(directory, "e2e.sqlite")

    try {
      await setupE2eContentDatabase(databasePath)
      await setupE2eAuthDatabase(databasePath)

      const database = createWritingAppDatabase(databasePath)
      try {
        expect(readTableNames(database.sqlite)).toEqual(
          [...requiredApplicationBackupTableNames].sort()
        )
        expect(
          database.sqlite
            .query<{ readonly email: string; readonly id: string }, []>(
              "SELECT id, email FROM user ORDER BY id"
            )
            .all()
        ).toEqual([{ email: "learner@example.com", id: "user-1" }])
        expect(
          database.sqlite
            .query<
              {
                readonly providerId: string
                readonly userId: string
              },
              []
            >(
              "SELECT user_id AS userId, provider_id AS providerId FROM account ORDER BY id"
            )
            .all()
        ).toEqual([{ providerId: "credential", userId: "user-1" }])
        expect(
          database.sqlite
            .query<{ readonly email: string; readonly id: string }, []>(
              "SELECT id, email FROM admin_user ORDER BY id"
            )
            .all()
        ).toEqual([{ email: "owner@example.test", id: "e2e-owner" }])
        expect(
          database.sqlite
            .query<
              {
                readonly providerId: string
                readonly userId: string
              },
              []
            >(
              "SELECT user_id AS userId, provider_id AS providerId FROM admin_account ORDER BY id"
            )
            .all()
        ).toEqual([{ providerId: "credential", userId: "e2e-owner" }])
        expect(readSessionCount(database.sqlite)).toEqual({
          admin: 0,
          learner: 0,
        })
        expect(readCanonicalStepTypes(database.sqlite)).toEqual(
          [...lessonStepTypeValues].sort()
        )
      } finally {
        database.close()
      }
    } finally {
      rmSync(directory, { recursive: true })
    }
  })
})

function readTableNames(
  sqlite: ReturnType<typeof createWritingAppDatabase>["sqlite"]
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)
    .all()
    .map(({ name }) => name)
}

function readSessionCount(
  sqlite: ReturnType<typeof createWritingAppDatabase>["sqlite"]
): Readonly<{ admin: number; learner: number }> {
  const row = sqlite
    .query<{ readonly admin: number; readonly learner: number }, []>(`
      SELECT
        (SELECT COUNT(*) FROM admin_session) AS admin,
        (SELECT COUNT(*) FROM session) AS learner
    `)
    .get()
  if (row === null) throw new Error("E2E session count를 읽을 수 없습니다.")
  return row
}

function readCanonicalStepTypes(
  sqlite: ReturnType<typeof createWritingAppDatabase>["sqlite"]
): readonly string[] {
  return sqlite
    .query<{ readonly type: string }, []>(`
      SELECT DISTINCT step.type
      FROM lesson_step_versions AS step
      INNER JOIN course_curriculum_versions AS curriculum
        ON curriculum.id = step.curriculum_version_id
      WHERE curriculum.course_id NOT LIKE 'e2e-%'
      ORDER BY step.type
    `)
    .all()
    .map(({ type }) => type)
}
