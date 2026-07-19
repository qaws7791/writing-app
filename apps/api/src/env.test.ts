import { describe, expect, it } from "vitest"

import { parseApiEnv } from "@/env"

const learnerSecret = "learner-test-secret-0123456789abcdef"
const adminSecret = "admin-test-secret-0123456789abcdef"

describe("통합 API env", () => {
  it("두 audience의 독립 실행 설정을 명시적으로 만든다", () => {
    const env = parseApiEnv(createTestEnvironment())

    expect(env).toMatchObject({
      adminAuthBaseUrl: "http://127.0.0.1:4000",
      adminAssetStore: undefined,
      adminBetterAuthSecret: adminSecret,
      adminCookieDomain: undefined,
      adminOrigin: "http://127.0.0.1:3001",
      authBaseUrl: "http://localhost:4000",
      betterAuthSecret: learnerSecret,
      cookieDomain: undefined,
      cursorSigningSecret: `${learnerSecret}:cursor-signing`,
      databaseUrl: ":memory:",
      deploymentVersion: "local",
      nodeEnv: "test",
      openAiApiKey: undefined,
      openAiModel: "gpt-5.2",
      port: 4000,
      testAuthEnabled: false,
      webOrigin: "http://localhost:3000",
    })
    expect([...env.apiHosts.learner]).toEqual(["localhost:4000", "api:4000"])
    expect([...env.apiHosts.admin]).toEqual([
      "127.0.0.1:4000",
      "admin-api:4000",
    ])
  })

  it.each([
    "ADMIN_BETTER_AUTH_SECRET",
    "ADMIN_BETTER_AUTH_URL",
    "ADMIN_ORIGIN",
    "ADMIN_API_ALLOWED_HOSTS",
    "LEARNER_API_ALLOWED_HOSTS",
  ] as const)("%s는 모든 실행 환경에서 필수다", (name) => {
    expect(() =>
      parseApiEnv({ ...createTestEnvironment(), [name]: undefined })
    ).toThrow(name)
  })

  it("learner와 admin secret 및 origin을 공유하지 못하게 한다", () => {
    expect(() =>
      parseApiEnv({
        ...createTestEnvironment(),
        ADMIN_BETTER_AUTH_SECRET: learnerSecret,
      })
    ).toThrow(/학습자 secret과 다른 값/u)
    expect(() =>
      parseApiEnv({
        ...createTestEnvironment(),
        ADMIN_ORIGIN: "http://localhost:3000",
      })
    ).toThrow(/학습자 origin과 다른 값/u)
  })

  it.each([
    ["BETTER_AUTH_URL", "http://unknown.localhost:4000"],
    ["ADMIN_BETTER_AUTH_URL", "http://unknown.localhost:4000"],
  ] as const)("%s host가 audience allowlist 밖이면 거부한다", (name, value) => {
    expect(() =>
      parseApiEnv({ ...createTestEnvironment(), [name]: value })
    ).toThrow(new RegExp(name))
  })

  it("admin cookie domain은 learner cookie 설정에서 fallback하지 않는다", () => {
    const learnerOnly = parseApiEnv({
      ...createTestEnvironment(),
      BETTER_AUTH_COOKIE_DOMAIN: "localhost",
    })
    const separated = parseApiEnv({
      ...createTestEnvironment(),
      ADMIN_BETTER_AUTH_COOKIE_DOMAIN: "admin.localhost",
      BETTER_AUTH_COOKIE_DOMAIN: "localhost",
    })

    expect(learnerOnly.cookieDomain).toBe("localhost")
    expect(learnerOnly.adminCookieDomain).toBeUndefined()
    expect(separated.cookieDomain).toBe("localhost")
    expect(separated.adminCookieDomain).toBe("admin.localhost")
  })

  it("development에서만 학습자 test auth를 활성화한다", () => {
    expect(
      parseApiEnv({
        ...createTestEnvironment(),
        ENABLE_TEST_AUTH: "true",
        NODE_ENV: "development",
      }).testAuthEnabled
    ).toBe(true)
    expect(() =>
      parseApiEnv({
        ...createProductionEnvironment(),
        ENABLE_TEST_AUTH: "true",
      })
    ).toThrow(/ENABLE_TEST_AUTH/u)
  })

  it("production은 영구 DB, 배포 버전과 cursor 전용 secret을 요구한다", () => {
    expect(parseApiEnv(createProductionEnvironment())).toMatchObject({
      adminAuthBaseUrl: "https://admin-api.example.com",
      adminAssetStore: {
        accessKeyId: "asset-access-key",
        bucket: "writing-app-assets",
        endpoint: "https://r2.example.com",
        publicBaseUrl: "https://assets.example.com",
        region: "auto",
        secretAccessKey: "asset-secret-key",
      },
      adminOrigin: "https://admin.example.com",
      authBaseUrl: "https://api.example.com",
      cursorSigningSecret: "a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ1234567890AB",
      databaseUrl: "file:/var/lib/writing-app/api.sqlite",
      deploymentVersion: "api@sha256:test",
      nodeEnv: "production",
      webOrigin: "https://app.example.com",
    })
    expect(() =>
      parseApiEnv({
        ...createProductionEnvironment(),
        CURSOR_SIGNING_SECRET: undefined,
      })
    ).toThrow(/CURSOR_SIGNING_SECRET/u)
    expect(() =>
      parseApiEnv({
        ...createProductionEnvironment(),
        DEPLOYMENT_VERSION: undefined,
      })
    ).toThrow(/DEPLOYMENT_VERSION/u)
  })

  it("자료 이미지 저장소는 원자적으로 설정하고 production에서는 HTTPS 구성을 요구한다", () => {
    expect(() =>
      parseApiEnv({
        ...createTestEnvironment(),
        ADMIN_ASSET_S3_BUCKET: "writing-app-assets",
      })
    ).toThrow(/자료 이미지 저장소 환경 변수/u)
    expect(() =>
      parseApiEnv({
        ...createProductionEnvironment(),
        ADMIN_ASSET_S3_ENDPOINT: "http://r2.example.com",
      })
    ).toThrow(/HTTPS/u)
    expect(() => {
      const environment = createProductionEnvironment()
      delete environment.ADMIN_ASSET_S3_ACCESS_KEY
      return parseApiEnv(environment)
    }).toThrow(/자료 이미지 저장소 환경 변수/u)
  })
})

function createTestEnvironment(): Record<string, string | undefined> {
  return {
    ADMIN_API_ALLOWED_HOSTS: "127.0.0.1:4000,admin-api:4000",
    ADMIN_BETTER_AUTH_SECRET: adminSecret,
    ADMIN_BETTER_AUTH_URL: "http://127.0.0.1:4000",
    ADMIN_ORIGIN: "http://127.0.0.1:3001",
    API_PORT: "4000",
    BETTER_AUTH_SECRET: learnerSecret,
    BETTER_AUTH_URL: "http://localhost:4000",
    DATABASE_URL: ":memory:",
    LEARNER_API_ALLOWED_HOSTS: "localhost:4000,api:4000",
    NODE_ENV: "test",
    WEB_ORIGIN: "http://localhost:3000",
  }
}

function createProductionEnvironment(): Record<string, string | undefined> {
  return {
    ADMIN_API_ALLOWED_HOSTS: "admin-api.example.com,admin-api-unified:4000",
    ADMIN_ASSET_PUBLIC_BASE_URL: "https://assets.example.com",
    ADMIN_ASSET_S3_ACCESS_KEY: "asset-access-key",
    ADMIN_ASSET_S3_BUCKET: "writing-app-assets",
    ADMIN_ASSET_S3_ENDPOINT: "https://r2.example.com",
    ADMIN_ASSET_S3_SECRET_KEY: "asset-secret-key",
    ADMIN_BETTER_AUTH_SECRET:
      "FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210",
    ADMIN_BETTER_AUTH_URL: "https://admin-api.example.com",
    ADMIN_ORIGIN: "https://admin.example.com",
    BETTER_AUTH_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef",
    BETTER_AUTH_URL: "https://api.example.com",
    CURSOR_SIGNING_SECRET: "a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ1234567890AB",
    DATABASE_URL: "file:/var/lib/writing-app/api.sqlite",
    DEPLOYMENT_VERSION: "api@sha256:test",
    LEARNER_API_ALLOWED_HOSTS: "api.example.com,api:4000",
    NODE_ENV: "production",
    WEB_ORIGIN: "https://app.example.com",
  }
}
