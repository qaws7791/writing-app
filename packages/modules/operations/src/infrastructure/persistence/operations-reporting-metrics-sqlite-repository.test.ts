import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/test-support/d1-database"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"
import { aLearner } from "@workspace/identity/test-fixtures"
import { aWriting } from "@workspace/writing/test-fixtures"

import { createSqliteOperationsReportingRepository } from "#operations/infrastructure/persistence/operations-reporting-sqlite-repository"

const activeLearnerId = "active-writing-learner"
const deletedLearnerId = "deleted-writing-learner"

describe("operations writing reporting", () => {
  it("쓰기 지표는 삭제 학습자와 글 원문을 제외한 event만 집계한다", async () => {
    const fixture = await createReportingFixture()

    try {
      const repository = await createSqliteOperationsReportingRepository(
        fixture.readOnly.sqlite
      )

      const dashboard = await repository.readDashboard({
        activeFrom: "2026-08-04",
        matureCohortThrough: "2026-08-02",
        reportDate: "2026-08-10",
      })
      const projectedEvent = await fixture.readOnly.sqlite
        .query<
          Readonly<{
            event_type: string
            recorded_at: number
            user_id: string
            writing_id: string
          }>,
          [string]
        >(
          `SELECT *
           FROM writing_reporting_events
           WHERE user_id = ?1
             AND event_type = 'writing_created'`
        )
        .get(activeLearnerId)

      expect({
        revisionAfterCheck: dashboard.metrics.writingRevisionAfterCheckRate,
        checkSuccess: dashboard.metrics.writingCheckSuccessRate,
      }).toEqual({
        revisionAfterCheck: {
          denominator: 1,
          numerator: 1,
          percentage: 100,
          status: "available",
        },
        checkSuccess: {
          denominator: 1,
          numerator: 1,
          percentage: 100,
          status: "available",
        },
      })
      expect(projectedEvent).toEqual({
        event_type: "writing_created",
        recorded_at: 1,
        user_id: activeLearnerId,
        writing_id: "active-writing",
      })
      expect(JSON.stringify(dashboard)).not.toContain("Test writing")
    } finally {
      await fixture.close()
    }
  })
})

async function createReportingFixture() {
  const database = await createInMemoryWritingAppDatabase()
  try {
    await runCurrentTestMigration(database.sqlite)
    await seedWritingReporting(database.sqlite)
    return { readOnly: database, close: database.close }
  } catch (cause) {
    await database.close()
    throw cause
  }
}

async function seedWritingReporting(sqlite: WritingAppSqlite): Promise<void> {
  await aLearner(sqlite, { id: activeLearnerId })
  await aLearner(sqlite, {
    deletedAt: Date.parse("2026-08-01T00:00:00.000Z"),
    id: deletedLearnerId,
    status: "deleted",
  })

  for (const writing of [
    { id: "active-writing", userId: activeLearnerId },
    { id: "deleted-writing", userId: deletedLearnerId },
  ]) {
    await aWriting(sqlite, {
      eventTypes: ["writing_created", "check_succeeded", "revised_after_check"],
      ...writing,
    })
  }
}
