import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"
import {
  createReadOnlyWritingAppDatabase,
  createWritingAppDatabase,
} from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"
import { aLearner } from "@workspace/identity/test-fixtures"
import { aWriting } from "@workspace/writing/test-fixtures"

import { createSqliteOperationsReportingRepository } from "#operations/infrastructure/persistence/operations-reporting-sqlite-repository"

const activeLearnerId = "active-writing-learner"
const deletedLearnerId = "deleted-writing-learner"

describe("operations writing reporting", () => {
  it("쓰기 지표는 삭제 학습자와 글 원문을 제외한 event만 집계한다", () => {
    const fixture = createReportingFixture()

    try {
      const repository = createSqliteOperationsReportingRepository(
        fixture.readOnly.sqlite
      )

      const dashboard = repository.readDashboard({
        activeFrom: "2026-08-04",
        matureCohortThrough: "2026-08-02",
        reportDate: "2026-08-10",
      })
      const projectedEvent = fixture.readOnly.sqlite
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
        revisionAfterSelfCheck:
          dashboard.metrics.writingRevisionAfterSelfCheckRate,
        selfCheckStart: dashboard.metrics.writingSelfCheckStartRate,
      }).toEqual({
        revisionAfterSelfCheck: {
          denominator: 1,
          numerator: 1,
          percentage: 100,
          status: "available",
        },
        selfCheckStart: {
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
      fixture.close()
    }
  })
})

type ReportingFixture = Readonly<{
  close: () => void
  readOnly: ReturnType<typeof createReadOnlyWritingAppDatabase>
}>

function createReportingFixture(): ReportingFixture {
  const directory = mkdtempSync(join(tmpdir(), "operations-writing-reporting-"))
  const databasePath = join(directory, "reporting.sqlite")
  let readOnly: ReturnType<typeof createReadOnlyWritingAppDatabase> | undefined
  let writer: ReturnType<typeof createWritingAppDatabase> | undefined

  try {
    writer = createWritingAppDatabase(databasePath)
    runCurrentTestMigration(writer.sqlite)
    seedWritingReporting(writer.sqlite)
    writer.close()
    writer = undefined
    readOnly = createReadOnlyWritingAppDatabase(databasePath)
  } catch (error) {
    closeReportingFixture(readOnly, writer, directory)
    throw error
  }

  if (readOnly === undefined) {
    closeReportingFixture(readOnly, writer, directory)
    throw new Error("Operations reporting read-only fixture가 없습니다.")
  }

  const activeReadOnly = readOnly
  let closed = false
  return {
    close() {
      if (closed) return
      closed = true
      closeReportingFixture(activeReadOnly, writer, directory)
    },
    readOnly: activeReadOnly,
  }
}

function closeReportingFixture(
  readOnly: ReturnType<typeof createReadOnlyWritingAppDatabase> | undefined,
  writer: ReturnType<typeof createWritingAppDatabase> | undefined,
  directory: string
): void {
  try {
    readOnly?.close()
  } finally {
    try {
      writer?.close()
    } finally {
      rmSync(directory, { recursive: true })
    }
  }
}

function seedWritingReporting(sqlite: WritingAppSqlite): void {
  aLearner(sqlite, { id: activeLearnerId })
  aLearner(sqlite, {
    deletedAt: Date.parse("2026-08-01T00:00:00.000Z"),
    id: deletedLearnerId,
    status: "deleted",
  })

  for (const writing of [
    { id: "active-writing", userId: activeLearnerId },
    { id: "deleted-writing", userId: deletedLearnerId },
  ]) {
    aWriting(sqlite, {
      eventTypes: [
        "writing_created",
        "self_check_started",
        "revised_after_self_check",
      ],
      ...writing,
    })
  }
}
