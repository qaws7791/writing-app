import { describe, expect, it } from "vitest"
import {
  localRuntimeDefaults,
  localRuntimePorts,
} from "@workspace/env/local-runtime-defaults"

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
      assetStore: undefined,
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
      assetStore: undefined,
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

  it("production startup은 관리자 전용 secret과 HTTPS URL을 사용한다", () => {
    expect(
      parseAdminApiEnv({
        ADMIN_ASSET_PUBLIC_BASE_URL: "https://assets.example.com",
        ADMIN_ASSET_S3_ACCESS_KEY: "r2-access-key",
        ADMIN_ASSET_S3_BUCKET: "writing-app-public-assets",
        ADMIN_ASSET_S3_ENDPOINT:
          "https://example-account.r2.cloudflarestorage.com",
        ADMIN_ASSET_S3_REGION: "auto",
        ADMIN_ASSET_S3_SECRET_KEY: "r2-secret-key",
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
      adminOrigin: "https://admin.example.com",
      authBaseUrl: "https://admin-api.example.com",
      betterAuthSecret: "FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210",
      databaseUrl: "file:/var/lib/writing-app/api.sqlite",
      nodeEnv: "production",
    })
  })
})
