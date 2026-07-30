import { describe, expect, it } from "vitest"

import {
  parseDailyMaintenanceArguments,
  requireDailyMaintenanceApproval,
} from "@/scripts/maintenance-daily"

describe("daily maintenance CLI guard", () => {
  it("batch와 dry-run만 명시적으로 파싱한다", () => {
    expect(parseDailyMaintenanceArguments([])).toEqual({
      batchSize: 100,
      dryRun: false,
    })
    expect(
      parseDailyMaintenanceArguments(["--batch-size=25", "--dry-run"])
    ).toEqual({
      batchSize: 25,
      dryRun: true,
    })
    expect(() => parseDailyMaintenanceArguments(["--batch-size=0"])).toThrow(
      /batch size/u
    )
    expect(() => parseDailyMaintenanceArguments(["--unknown"])).toThrow(
      /지원하지 않는/u
    )
  })

  it("환경·DB 확인값과 actual 승인이 모두 일치해야 한다", () => {
    const options = { batchSize: 100, dryRun: false }
    const environment = {
      DAILY_MAINTENANCE_APPROVED: "true",
      DAILY_MAINTENANCE_ENVIRONMENT: "test",
      DAILY_MAINTENANCE_EXPECTED_DATABASE_URL: "target.sqlite",
      DATABASE_URL: "target.sqlite",
      DEPLOYMENT_ENVIRONMENT: "test",
      NODE_ENV: "test",
    }

    expect(() =>
      requireDailyMaintenanceApproval(
        { ...environment, DATABASE_URL: undefined },
        options
      )
    ).toThrow(/DATABASE_URL/u)
    expect(() =>
      requireDailyMaintenanceApproval(
        { ...environment, DAILY_MAINTENANCE_ENVIRONMENT: "production" },
        options
      )
    ).toThrow(/DEPLOYMENT_ENVIRONMENT/u)
    expect(() =>
      requireDailyMaintenanceApproval(
        { ...environment, DEPLOYMENT_ENVIRONMENT: "staging" },
        options
      )
    ).toThrow(/DEPLOYMENT_ENVIRONMENT/u)
    expect(() =>
      requireDailyMaintenanceApproval(
        {
          ...environment,
          DAILY_MAINTENANCE_EXPECTED_DATABASE_URL: "other.sqlite",
        },
        options
      )
    ).toThrow(/일치하지/u)
    expect(() =>
      requireDailyMaintenanceApproval(
        { ...environment, DAILY_MAINTENANCE_APPROVED: undefined },
        options
      )
    ).toThrow(/APPROVED=true/u)
    expect(requireDailyMaintenanceApproval(environment, options)).toEqual({
      databaseUrl: "target.sqlite",
      logRetentionEvidenceFile: null,
    })
  })

  it("production actual은 외부 class retention 증거 파일 없이는 실행하지 않는다", () => {
    const production = createProductionEnvironment()

    expect(() =>
      requireDailyMaintenanceApproval(production, {
        batchSize: 100,
        dryRun: false,
      })
    ).toThrow(/retention 증거 파일/u)
    expect(
      requireDailyMaintenanceApproval(
        {
          ...production,
          MAINTENANCE_LOG_RETENTION_EVIDENCE_FILE:
            "/run/secrets/log-retention-evidence.json",
        },
        { batchSize: 100, dryRun: false }
      )
    ).toEqual({
      databaseUrl: "production.sqlite",
      logRetentionEvidenceFile: "/run/secrets/log-retention-evidence.json",
    })
  })

  it("production dry-run과 staging actual은 retention 증거 파일 없이도 허용한다", () => {
    const production = createProductionEnvironment()

    expect(
      requireDailyMaintenanceApproval(production, {
        batchSize: 100,
        dryRun: true,
      })
    ).toEqual({
      databaseUrl: "production.sqlite",
      logRetentionEvidenceFile: null,
    })
    expect(
      requireDailyMaintenanceApproval(
        {
          ...production,
          DAILY_MAINTENANCE_ENVIRONMENT: "staging",
          DEPLOYMENT_ENVIRONMENT: "staging",
        },
        { batchSize: 100, dryRun: false }
      )
    ).toEqual({
      databaseUrl: "production.sqlite",
      logRetentionEvidenceFile: null,
    })
  })
})

function createProductionEnvironment() {
  return {
    DAILY_MAINTENANCE_APPROVED: "true",
    DAILY_MAINTENANCE_ENVIRONMENT: "production",
    DAILY_MAINTENANCE_EXPECTED_DATABASE_URL: "production.sqlite",
    DATABASE_URL: "production.sqlite",
    DEPLOYMENT_ENVIRONMENT: "production",
    NODE_ENV: "production",
  }
}
