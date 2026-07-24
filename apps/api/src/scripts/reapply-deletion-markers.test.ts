import { describe, expect, it } from "vitest"

import {
  parseReapplyDeletionMarkersArguments,
  requireReapplyDeletionMarkersApproval,
} from "@/scripts/reapply-deletion-markers"

describe("삭제 marker 복구 CLI guard", () => {
  it("timezone이 명확한 snapshot과 bounded batch만 허용한다", () => {
    expect(
      parseReapplyDeletionMarkersArguments([
        "--snapshot-at=2026-07-24T00:00:00.000Z",
        "--batch-size=25",
        "--dry-run",
      ])
    ).toEqual({
      batchSize: 25,
      dryRun: true,
      snapshotAt: new Date("2026-07-24T00:00:00.000Z"),
    })
    expect(() => parseReapplyDeletionMarkersArguments([])).toThrow(/snapshot/u)
    expect(() =>
      parseReapplyDeletionMarkersArguments(["--snapshot-at=2026-07-24"])
    ).toThrow(/timezone/u)
    expect(() =>
      parseReapplyDeletionMarkersArguments([
        "--snapshot-at=2026-07-24T00:00:00.000Z",
        "--batch-size=1001",
      ])
    ).toThrow(/batch size/u)
    expect(() =>
      parseReapplyDeletionMarkersArguments([
        "--snapshot-at=2026-07-24T00:00:00.000Z",
        "--unknown",
      ])
    ).toThrow(/지원하지 않는/u)
  })

  it("복구 환경·대상 DB 확인값과 actual 승인이 모두 일치해야 한다", () => {
    const options = {
      batchSize: 100,
      dryRun: false,
      snapshotAt: new Date("2026-07-24T00:00:00.000Z"),
    }
    const environment = {
      DATABASE_URL: "restored.sqlite",
      DELETION_RESTORE_APPROVED: "true",
      DELETION_RESTORE_ENVIRONMENT: "production",
      DELETION_RESTORE_EXPECTED_DATABASE_URL: "restored.sqlite",
      DEPLOYMENT_ENVIRONMENT: "production",
      NODE_ENV: "production",
    }

    expect(() =>
      requireReapplyDeletionMarkersApproval(
        { ...environment, DATABASE_URL: undefined },
        options
      )
    ).toThrow(/DATABASE_URL/u)
    expect(() =>
      requireReapplyDeletionMarkersApproval(
        { ...environment, DELETION_RESTORE_ENVIRONMENT: "test" },
        options
      )
    ).toThrow(/DEPLOYMENT_ENVIRONMENT/u)
    expect(() =>
      requireReapplyDeletionMarkersApproval(
        { ...environment, DEPLOYMENT_ENVIRONMENT: "staging" },
        options
      )
    ).toThrow(/DEPLOYMENT_ENVIRONMENT/u)
    expect(() =>
      requireReapplyDeletionMarkersApproval(
        {
          ...environment,
          DELETION_RESTORE_EXPECTED_DATABASE_URL: "other.sqlite",
        },
        options
      )
    ).toThrow(/일치하지/u)
    expect(() =>
      requireReapplyDeletionMarkersApproval(
        { ...environment, DELETION_RESTORE_APPROVED: undefined },
        options
      )
    ).toThrow(/APPROVED=true/u)
    expect(requireReapplyDeletionMarkersApproval(environment, options)).toBe(
      "restored.sqlite"
    )
    expect(
      requireReapplyDeletionMarkersApproval(
        { ...environment, DELETION_RESTORE_APPROVED: undefined },
        { ...options, dryRun: true }
      )
    ).toBe("restored.sqlite")
  })
})
