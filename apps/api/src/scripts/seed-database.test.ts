import { describe, expect, it } from "vitest"
import { getDefaultDatabaseUrl } from "@workspace/db/client"

import { parseSeedDatabaseEnvironment } from "@/scripts/seed-database"

describe("통합 database seed 명령", () => {
  it("non-production은 명시한 대상 또는 로컬 기본값을 사용한다", () => {
    expect(
      parseSeedDatabaseEnvironment({
        DATABASE_URL: "file:data/fixture.sqlite",
        NODE_ENV: "development",
      })
    ).toBe("file:data/fixture.sqlite")
    expect(parseSeedDatabaseEnvironment({ NODE_ENV: "test" })).toBe(
      getDefaultDatabaseUrl()
    )
  })

  it("production은 승인 flag, 명시적 대상과 동일한 확인값을 모두 요구한다", () => {
    const environment = {
      DATABASE_URL: "file:/var/lib/writing-app/api.sqlite",
      NODE_ENV: "production",
    } as const

    expect(() => parseSeedDatabaseEnvironment(environment)).toThrow(
      "DATABASE_SEED_PRODUCTION_APPROVED"
    )
    expect(() =>
      parseSeedDatabaseEnvironment({
        DATABASE_SEED_PRODUCTION_APPROVED: "true",
        NODE_ENV: "production",
      })
    ).toThrow("명시적인 DATABASE_URL")
    expect(() =>
      parseSeedDatabaseEnvironment({
        ...environment,
        DATABASE_SEED_EXPECTED_DATABASE_URL: "file:/other/api.sqlite",
        DATABASE_SEED_PRODUCTION_APPROVED: "true",
      })
    ).toThrow("확인값")
    expect(
      parseSeedDatabaseEnvironment({
        ...environment,
        DATABASE_SEED_EXPECTED_DATABASE_URL: environment.DATABASE_URL,
        DATABASE_SEED_PRODUCTION_APPROVED: "true",
      })
    ).toBe(environment.DATABASE_URL)
  })
})
