import { describe, expect, it } from "vitest"
import { localRuntimeDefaults, localRuntimePorts } from "@workspace/env"

import { parseAdminApiEnv } from "@/env"

describe("어드민 API env", () => {
  it("공통 env에서 어드민 API 실행 설정을 만든다", () => {
    expect(
      parseAdminApiEnv({
        ADMIN_API_PORT: "4102",
        ADMIN_ORIGIN: localRuntimeDefaults.adminWebOrigin,
        BETTER_AUTH_SECRET: "x".repeat(32),
        DATABASE_URL: ":memory:",
        NODE_ENV: "test",
      })
    ).toEqual({
      adminOrigin: localRuntimeDefaults.adminWebOrigin,
      authBaseUrl: "http://localhost:4102",
      betterAuthSecret: "x".repeat(32),
      cookieDomain: undefined,
      databaseUrl: ":memory:",
      nodeEnv: "test",
      openAiApiKey: undefined,
      openAiModel: "gpt-5.2",
      port: 4102,
    })
  })

  it("기존 로컬 어드민 secret과 origin 이름을 새 실행 설정으로 정규화한다", () => {
    expect(
      parseAdminApiEnv({
        ADMIN_BETTER_AUTH_SECRET: "x".repeat(32),
        ADMIN_BETTER_AUTH_URL: localRuntimeDefaults.adminApiBaseUrl,
        ADMIN_CORS_ORIGIN: localRuntimeDefaults.adminWebOrigin,
        DATABASE_URL: ":memory:",
        NODE_ENV: "test",
      })
    ).toEqual({
      adminOrigin: localRuntimeDefaults.adminWebOrigin,
      authBaseUrl: localRuntimeDefaults.adminApiBaseUrl,
      betterAuthSecret: "x".repeat(32),
      cookieDomain: undefined,
      databaseUrl: ":memory:",
      nodeEnv: "test",
      openAiApiKey: undefined,
      openAiModel: "gpt-5.2",
      port: localRuntimePorts.adminApi,
    })
  })

  it("공통 secret과 관리자 secret이 모두 있으면 관리자 secret을 사용한다", () => {
    expect(
      parseAdminApiEnv({
        ADMIN_BETTER_AUTH_SECRET: "a".repeat(32),
        ADMIN_CORS_ORIGIN: localRuntimeDefaults.adminWebOrigin,
        BETTER_AUTH_SECRET: "x".repeat(32),
        DATABASE_URL: ":memory:",
        NODE_ENV: "test",
      }).betterAuthSecret
    ).toBe("a".repeat(32))
  })

  it("선택 관리자 Better Auth 쿠키 도메인을 읽는다", () => {
    expect(
      parseAdminApiEnv({
        ADMIN_BETTER_AUTH_COOKIE_DOMAIN: "example.com",
        ADMIN_BETTER_AUTH_SECRET: "x".repeat(32),
        ADMIN_BETTER_AUTH_URL: localRuntimeDefaults.adminApiBaseUrl,
        ADMIN_CORS_ORIGIN: localRuntimeDefaults.adminWebOrigin,
        DATABASE_URL: ":memory:",
        NODE_ENV: "test",
      }).cookieDomain
    ).toBe("example.com")
  })
})
