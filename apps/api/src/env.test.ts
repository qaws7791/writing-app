import { describe, expect, it } from "vitest"

import { parseApiEnv } from "@/env"

describe("API env", () => {
  it("공통 env에서 API 실행 설정을 만든다", () => {
    expect(
      parseApiEnv({
        API_PORT: "4101",
        BETTER_AUTH_SECRET: "x".repeat(32),
        DATABASE_URL: ":memory:",
        NODE_ENV: "test",
        OPENAI_API_KEY: "sk-test",
        OPENAI_MODEL: "gpt-5.4-mini",
        WEB_ORIGIN: "http://localhost:3000",
      })
    ).toEqual({
      authBaseUrl: "http://localhost:4101",
      databaseUrl: ":memory:",
      googleClientId: undefined,
      googleClientSecret: undefined,
      nodeEnv: "test",
      openAiApiKey: "sk-test",
      openAiModel: "gpt-5.4-mini",
      port: 4101,
      webOrigin: "http://localhost:3000",
    })
  })

  it("기존 로컬 API origin 이름을 새 실행 설정으로 정규화한다", () => {
    expect(
      parseApiEnv({
        BETTER_AUTH_SECRET: "x".repeat(32),
        CORS_ORIGIN: "http://localhost:3000,http://localhost:3001",
        DATABASE_URL: ":memory:",
        NODE_ENV: "test",
      })
    ).toEqual({
      authBaseUrl: "http://localhost:3001",
      databaseUrl: ":memory:",
      googleClientId: undefined,
      googleClientSecret: undefined,
      nodeEnv: "test",
      openAiApiKey: undefined,
      openAiModel: "gpt-5.2",
      port: 3001,
      webOrigin: "http://localhost:3000",
    })
  })
})
