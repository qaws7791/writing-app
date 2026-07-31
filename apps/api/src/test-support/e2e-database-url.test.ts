import path from "node:path"

import { describe, expect, it } from "vitest"

import { requireE2eDatabaseUrl } from "@/test-support/e2e-database-url"

describe("E2E database path guard", () => {
  const runRoot = path.resolve("tmp", "e2e-run")
  const databasePath = path.join(runRoot, "writing-app.sqlite")

  it("격리 실행 루트의 고정 SQLite 파일만 허용한다", () => {
    expect(
      requireE2eDatabaseUrl({
        DATABASE_URL: `file:${databasePath}`,
        E2E_RUN_ROOT: runRoot,
        NODE_ENV: "test",
      })
    ).toBe(databasePath)
  })

  it("test 환경이 아니거나 실행 루트 밖의 경로면 거절한다", () => {
    expect(() =>
      requireE2eDatabaseUrl({
        DATABASE_URL: databasePath,
        E2E_RUN_ROOT: runRoot,
        NODE_ENV: "production",
      })
    ).toThrow("NODE_ENV=test")
    expect(() =>
      requireE2eDatabaseUrl({
        DATABASE_URL: path.join(runRoot, "other.sqlite"),
        E2E_RUN_ROOT: runRoot,
        NODE_ENV: "test",
      })
    ).toThrow("허용되지 않은 E2E 데이터베이스 경로")
  })
})
