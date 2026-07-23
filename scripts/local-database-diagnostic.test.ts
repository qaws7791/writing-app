import path from "node:path"

import { describe, expect, test } from "bun:test"

import {
  createSetupDatabaseBackupPath,
  parseLocalDatabaseDiagnostic,
  parseLocalDatabaseDiagnosticProcessResult,
} from "#scripts/local-database-diagnostic"

describe("로컬 DB 진단 경계", () => {
  test("현재·migration 필요·차단 결과를 discriminated union으로 해석한다", () => {
    expect(
      parseLocalDatabaseDiagnostic(
        JSON.stringify({
          checks: {},
          issues: [],
          kind: "application-database-diagnostic",
          schema: "current",
          status: "ok",
        })
      )
    ).toEqual({ schema: "current", status: "ok" })
    expect(
      parseLocalDatabaseDiagnostic(
        JSON.stringify({
          checks: {},
          issues: [],
          kind: "application-database-diagnostic",
          pendingMigrationIds: ["0001-next-schema-change"],
          schema: "current",
          status: "migration-required",
        })
      )
    ).toEqual({
      pendingMigrationIds: ["0001-next-schema-change"],
      schema: "current",
      status: "migration-required",
    })
    expect(
      parseLocalDatabaseDiagnostic(
        JSON.stringify({
          checks: {},
          issues: [],
          kind: "application-database-diagnostic",
          reason: "unknown schema",
          schema: "unsupported",
          status: "blocked",
        })
      )
    ).toEqual({
      reason: "unknown schema",
      schema: "unsupported",
      status: "blocked",
    })
  })

  test("모호하거나 잘못된 결과를 fail-closed한다", () => {
    expect(() => parseLocalDatabaseDiagnostic("not-json")).toThrow(
      "유효한 JSON"
    )
    expect(() =>
      parseLocalDatabaseDiagnostic(
        JSON.stringify({
          kind: "application-database-diagnostic",
          schema: "unknown",
          status: "ok",
        })
      )
    ).toThrow("schema/status")
    expect(() =>
      parseLocalDatabaseDiagnostic(
        JSON.stringify({
          kind: "application-database-diagnostic",
          schema: "current",
          status: "migration-required",
        })
      )
    ).toThrow("pending migration")
  })

  test("진단 status와 process 종료 코드 계약이 다르면 fail-closed한다", () => {
    const current = JSON.stringify({
      kind: "application-database-diagnostic",
      schema: "current",
      status: "ok",
    })
    const pending = JSON.stringify({
      kind: "application-database-diagnostic",
      pendingMigrationIds: ["0001-next-schema-change"],
      schema: "current",
      status: "migration-required",
    })

    expect(
      parseLocalDatabaseDiagnosticProcessResult({
        exitCode: 0,
        stderr: "",
        stdout: current,
      })
    ).toEqual({ schema: "current", status: "ok" })
    expect(
      parseLocalDatabaseDiagnosticProcessResult({
        exitCode: 2,
        stderr: "",
        stdout: pending,
      })
    ).toEqual({
      pendingMigrationIds: ["0001-next-schema-change"],
      schema: "current",
      status: "migration-required",
    })
    expect(() =>
      parseLocalDatabaseDiagnosticProcessResult({
        exitCode: 2,
        stderr: "",
        stdout: current,
      })
    ).toThrow("결과와 종료 코드")
    expect(() =>
      parseLocalDatabaseDiagnosticProcessResult({
        exitCode: 0,
        stderr: "",
        stdout: pending,
      })
    ).toThrow("결과와 종료 코드")
  })

  test("Windows와 POSIX에 안전한 timestamp 백업 경로를 만든다", () => {
    const backupPath = createSetupDatabaseBackupPath(
      path.resolve("fixture"),
      new Date("2026-07-23T12:34:56.789Z")
    )

    expect(path.basename(backupPath)).toBe(
      "setup-20260723T123456789Z-api.sqlite"
    )
    expect(path.basename(backupPath)).not.toContain(":")
    expect(path.dirname(backupPath)).toEndWith(
      path.join("fixture", "data", "backups")
    )
  })
})
