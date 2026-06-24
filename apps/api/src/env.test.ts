import { describe, expect, it } from "vitest"
import {
  createLocalRuntimeUrl,
  localRuntimeDefaults,
  localRuntimePorts,
} from "@workspace/env"

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
        WEB_ORIGIN: localRuntimeDefaults.learnerWebOrigin,
      })
    ).toEqual({
      authBaseUrl: createLocalRuntimeUrl(4101),
      betterAuthSecret: "x".repeat(32),
      cookieDomain: undefined,
      databaseUrl: ":memory:",
      googleClientId: undefined,
      googleClientSecret: undefined,
      nodeEnv: "test",
      openAiApiKey: "sk-test",
      openAiModel: "gpt-5.4-mini",
      port: 4101,
      testAuthEnabled: false,
      webOrigin: localRuntimeDefaults.learnerWebOrigin,
    })
  })

  it("기존 로컬 API origin 이름을 새 실행 설정으로 정규화한다", () => {
    expect(
      parseApiEnv({
        BETTER_AUTH_SECRET: "x".repeat(32),
        CORS_ORIGIN: [
          localRuntimeDefaults.learnerWebOrigin,
          localRuntimeDefaults.adminWebOrigin,
        ].join(","),
        DATABASE_URL: ":memory:",
        NODE_ENV: "test",
      })
    ).toEqual({
      authBaseUrl: localRuntimeDefaults.learnerApiBaseUrl,
      betterAuthSecret: "x".repeat(32),
      cookieDomain: undefined,
      databaseUrl: ":memory:",
      googleClientId: undefined,
      googleClientSecret: undefined,
      nodeEnv: "test",
      openAiApiKey: undefined,
      openAiModel: "gpt-5.2",
      port: localRuntimePorts.learnerApi,
      testAuthEnabled: false,
      webOrigin: localRuntimeDefaults.learnerWebOrigin,
    })
  })

  it("로컬 테스트 인증 플래그를 읽되 production에서는 끈다", () => {
    expect(
      parseApiEnv({
        BETTER_AUTH_SECRET: "x".repeat(32),
        ENABLE_TEST_AUTH: "true",
        NODE_ENV: "development",
      }).testAuthEnabled
    ).toBe(true)
    expect(
      parseApiEnv({
        BETTER_AUTH_SECRET: "x".repeat(32),
        ENABLE_TEST_AUTH: "true",
        NODE_ENV: "production",
      }).testAuthEnabled
    ).toBe(false)
  })

  it("선택 Better Auth 쿠키 도메인을 읽는다", () => {
    expect(
      parseApiEnv({
        BETTER_AUTH_COOKIE_DOMAIN: "example.com",
        BETTER_AUTH_SECRET: "x".repeat(32),
        DATABASE_URL: ":memory:",
        NODE_ENV: "test",
      }).cookieDomain
    ).toBe("example.com")
  })
})
