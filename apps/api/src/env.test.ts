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
        WEB_ORIGIN: "http://localhost:3000",
      })
    ).toEqual({
      databaseUrl: ":memory:",
      nodeEnv: "test",
      openAiApiKey: "sk-test",
      port: 4101,
      webOrigin: "http://localhost:3000",
    })
  })
})
