import { describe, expect, it } from "vitest"

import { parseEnv } from "@/parse-env"

const validSecret = "x".repeat(32)

describe("env parser", () => {
  it("문자열 환경 변수를 런타임 설정으로 검증하고 변환한다", () => {
    expect(
      parseEnv({
        ADMIN_API_PORT: "4002",
        ADMIN_ORIGIN: "http://localhost:3003",
        API_PORT: "4001",
        BETTER_AUTH_SECRET: validSecret,
        DATABASE_URL: ":memory:",
        NODE_ENV: "test",
        WEB_ORIGIN: "http://localhost:3000",
      })
    ).toEqual({
      ADMIN_API_PORT: 4002,
      ADMIN_ORIGIN: "http://localhost:3003",
      API_PORT: 4001,
      BETTER_AUTH_SECRET: validSecret,
      DATABASE_URL: ":memory:",
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
      NODE_ENV: "test",
      OPENAI_API_KEY: undefined,
      WEB_ORIGIN: "http://localhost:3000",
    })
  })

  it("Better Auth secret은 32자 이상이어야 한다", () => {
    expect(() =>
      parseEnv({
        BETTER_AUTH_SECRET: "short",
      })
    ).toThrow(/BETTER_AUTH_SECRET/)
  })

  it("port 범위를 명시적으로 검증한다", () => {
    expect(() =>
      parseEnv({
        API_PORT: "70000",
        BETTER_AUTH_SECRET: validSecret,
      })
    ).toThrow(/API_PORT/)
  })
})
