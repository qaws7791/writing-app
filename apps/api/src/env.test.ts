import { describe, expect, it } from "vitest"
import {
  createLocalRuntimeUrl,
  localRuntimeDefaults,
  localRuntimePorts,
} from "@workspace/env/local-runtime-defaults"

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

  it("로컬 테스트 인증 플래그를 읽되 production에서는 거부한다", () => {
    expect(
      parseApiEnv({
        BETTER_AUTH_SECRET: "x".repeat(32),
        ENABLE_TEST_AUTH: "true",
        NODE_ENV: "development",
      }).testAuthEnabled
    ).toBe(true)
    expect(() =>
      parseApiEnv({
        ADMIN_BETTER_AUTH_SECRET:
          "FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210",
        ADMIN_BETTER_AUTH_URL: "https://admin-api.example.com",
        ADMIN_ORIGIN: "https://admin.example.com",
        BETTER_AUTH_SECRET: "x".repeat(32),
        BETTER_AUTH_URL: "https://api.example.com",
        DATABASE_URL: "file:/var/lib/writing-app/api.sqlite",
        ENABLE_TEST_AUTH: "true",
        NODE_ENV: "production",
        WEB_ORIGIN: "https://app.example.com",
      })
    ).toThrow(/ENABLE_TEST_AUTH/)
  })

  it("production startup은 명시적 HTTPS·DB·분리 secret을 사용한다", () => {
    expect(
      parseApiEnv({
        ADMIN_BETTER_AUTH_SECRET:
          "FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210",
        ADMIN_BETTER_AUTH_URL: "https://admin-api.example.com",
        ADMIN_ORIGIN: "https://admin.example.com",
        BETTER_AUTH_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef",
        BETTER_AUTH_URL: "https://api.example.com",
        DATABASE_URL: "file:/var/lib/writing-app/api.sqlite",
        NODE_ENV: "production",
        WEB_ORIGIN: "https://app.example.com",
      })
    ).toMatchObject({
      authBaseUrl: "https://api.example.com",
      databaseUrl: "file:/var/lib/writing-app/api.sqlite",
      nodeEnv: "production",
      webOrigin: "https://app.example.com",
    })
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
