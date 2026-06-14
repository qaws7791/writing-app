import { describe, expect, it } from "vitest"

import { parseAdminApiEnv } from "@/env"

describe("어드민 API env", () => {
  it("공통 env에서 어드민 API 실행 설정을 만든다", () => {
    expect(
      parseAdminApiEnv({
        ADMIN_API_PORT: "4102",
        ADMIN_ORIGIN: "http://localhost:3003",
        BETTER_AUTH_SECRET: "x".repeat(32),
        DATABASE_URL: ":memory:",
        NODE_ENV: "test",
      })
    ).toEqual({
      adminOrigin: "http://localhost:3003",
      databaseUrl: ":memory:",
      nodeEnv: "test",
      port: 4102,
    })
  })

  it("기존 로컬 어드민 secret과 origin 이름을 새 실행 설정으로 정규화한다", () => {
    expect(
      parseAdminApiEnv({
        ADMIN_BETTER_AUTH_SECRET: "x".repeat(32),
        ADMIN_CORS_ORIGIN: "http://localhost:3001",
        DATABASE_URL: ":memory:",
        NODE_ENV: "test",
      })
    ).toEqual({
      adminOrigin: "http://localhost:3001",
      databaseUrl: ":memory:",
      nodeEnv: "test",
      port: 3002,
    })
  })
})
