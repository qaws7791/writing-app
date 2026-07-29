import { describe, expect, it } from "vitest"

import { parseApiEnv } from "@/config/env"

const learnerSecret = "learner-test-secret-0123456789abcdef"
const adminSecret = "admin-test-secret-0123456789abcdef"

describe("통합 API env", () => {
  it("두 app origin과 auth realm 설정을 명시적으로 만든다", () => {
    const env = parseApiEnv(createTestEnvironment())

    expect(env).toMatchObject({
      adminAssetStore: undefined,
      adminAuthSecret: adminSecret,
      adminOrigin: "http://localhost:3001",
      authEmail: { kind: "in-memory" },
      aiFeedback: {
        attemptPolicy: {
          maxCompletedAttempts: 3,
          pendingTtlMs: 60_000,
          providerTimeoutMs: 30_000,
        },
        dailyQuotaPolicy: {
          globalDailyRequestLimit: 1_000,
          globalDailySuccessLimit: 500,
          userDailyRequestLimit: 20,
          userDailySuccessLimit: 10,
        },
      },
      cursorSigningSecret: `${learnerSecret}:cursor-signing`,
      databaseUrl: ":memory:",
      deletionMarkerStore: undefined,
      deploymentEnvironment: "test",
      deploymentVersion: "local",
      enableApiDocs: true,
      learnerAuthSecret: learnerSecret,
      nodeEnv: "test",
      openAiApiKey: undefined,
      openAiModel: "gpt-5.2",
      port: 4000,
      webOrigin: "http://localhost:3000",
    })
  })

  it("AI feedback quota와 timeout을 명시적으로 파싱하고 잘못된 순서를 거절한다", () => {
    expect(
      parseApiEnv({
        ...createTestEnvironment(),
        AI_FEEDBACK_GLOBAL_DAILY_REQUEST_LIMIT: "400",
        AI_FEEDBACK_GLOBAL_DAILY_SUCCESS_LIMIT: "300",
        AI_FEEDBACK_PENDING_TTL_MS: "45000",
        AI_FEEDBACK_PROVIDER_TIMEOUT_MS: "15000",
        AI_FEEDBACK_USER_DAILY_REQUEST_LIMIT: "8",
        AI_FEEDBACK_USER_DAILY_SUCCESS_LIMIT: "5",
      }).aiFeedback
    ).toEqual({
      attemptPolicy: {
        maxCompletedAttempts: 3,
        pendingTtlMs: 45_000,
        providerTimeoutMs: 15_000,
      },
      dailyQuotaPolicy: {
        globalDailyRequestLimit: 400,
        globalDailySuccessLimit: 300,
        userDailyRequestLimit: 8,
        userDailySuccessLimit: 5,
      },
    })

    expect(() =>
      parseApiEnv({
        ...createTestEnvironment(),
        AI_FEEDBACK_PENDING_TTL_MS: "30000",
        AI_FEEDBACK_PROVIDER_TIMEOUT_MS: "30000",
      })
    ).toThrow(/AI feedback quota와 timeout/u)
    expect(() =>
      parseApiEnv({
        ...createTestEnvironment(),
        AI_FEEDBACK_USER_DAILY_REQUEST_LIMIT: "2",
        AI_FEEDBACK_USER_DAILY_SUCCESS_LIMIT: "3",
      })
    ).toThrow(/AI feedback quota와 timeout/u)
    expect(() =>
      parseApiEnv({
        ...createTestEnvironment(),
        AI_FEEDBACK_GLOBAL_DAILY_REQUEST_LIMIT: "2",
        AI_FEEDBACK_GLOBAL_DAILY_SUCCESS_LIMIT: "3",
      })
    ).toThrow(/AI feedback quota와 timeout/u)
    expect(() =>
      parseApiEnv({
        ...createTestEnvironment(),
        AI_FEEDBACK_PROVIDER_TIMEOUT_MS: "0",
      })
    ).toThrow()
  })

  it.each(["ADMIN_AUTH_SECRET", "LEARNER_AUTH_SECRET"] as const)(
    "%s는 모든 실행 환경에서 필수다",
    (name) => {
      expect(() =>
        parseApiEnv({ ...createTestEnvironment(), [name]: undefined })
      ).toThrow(name)
    }
  )

  it("learner와 admin secret 및 origin을 공유하지 못하게 한다", () => {
    expect(() =>
      parseApiEnv({
        ...createTestEnvironment(),
        ADMIN_AUTH_SECRET: learnerSecret,
      })
    ).toThrow(/학습자 secret과 다른 값/u)
    expect(() =>
      parseApiEnv({
        ...createTestEnvironment(),
        ADMIN_ORIGIN: "http://localhost:3000",
      })
    ).toThrow(/학습자 origin과 다른 값/u)
  })

  it("production은 영구 DB, 배포 버전과 cursor 전용 secret을 요구한다", () => {
    expect(parseApiEnv(createProductionEnvironment())).toMatchObject({
      adminAssetStore: {
        accessKeyId: "asset-access-key",
        bucket: "writing-app-assets",
        endpoint: "https://r2.example.com",
        publicBaseUrl: "https://assets.example.com",
        region: "auto",
        secretAccessKey: "asset-secret-key",
      },
      adminOrigin: "https://admin.example.com",
      authEmail: {
        from: "글결 <auth@example.com>",
        kind: "resend",
        replyTo: "support@example.com",
      },
      cursorSigningSecret: "a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ1234567890AB",
      databaseUrl: "file:/var/lib/writing-app/api.sqlite",
      deletionMarkerStore: {
        accessKeyId: "marker-access-key",
        bucket: "writing-app-deletion-markers",
        endpoint: "https://private-s3.example.com",
        prefix: "privacy/deletion-markers",
        region: "auto",
        secretAccessKey: "marker-secret-key",
      },
      deploymentEnvironment: "production",
      deploymentVersion: "api@sha256:test",
      enableApiDocs: false,
      googleClientId: "google-production-client-id",
      googleClientSecret: "google-production-client-secret",
      nodeEnv: "production",
      openAiApiKey: "openai-production-api-key",
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
        DEPLOYMENT_ENVIRONMENT: undefined,
      })
    ).toThrow(/DEPLOYMENT_ENVIRONMENT/u)
    expect(() =>
      parseApiEnv({
        ...createProductionEnvironment(),
        DEPLOYMENT_VERSION: undefined,
      })
    ).toThrow(/DEPLOYMENT_VERSION/u)
  })

  it("Node 실행 모드와 production/staging 배포 대상을 분리해 검증한다", () => {
    expect(
      parseApiEnv({
        ...createProductionEnvironment(),
        DEPLOYMENT_ENVIRONMENT: "staging",
      }).deploymentEnvironment
    ).toBe("staging")
    expect(() =>
      parseApiEnv({
        ...createProductionEnvironment(),
        DEPLOYMENT_ENVIRONMENT: "test",
      })
    ).toThrow(/NODE_ENV 실행 모드/u)
    expect(() =>
      parseApiEnv({
        ...createTestEnvironment(),
        DEPLOYMENT_ENVIRONMENT: "production",
      })
    ).toThrow(/NODE_ENV 실행 모드/u)
  })

  it("API 문서는 개발·테스트에서 기본 활성화하고 production은 명시적으로만 활성화한다", () => {
    expect(
      parseApiEnv({
        ...createProductionEnvironment(),
        ENABLE_API_DOCS: "true",
      }).enableApiDocs
    ).toBe(true)
    expect(
      parseApiEnv({
        ...createTestEnvironment(),
        ENABLE_API_DOCS: "false",
      }).enableApiDocs
    ).toBe(true)
    expect(() =>
      parseApiEnv({
        ...createTestEnvironment(),
        ENABLE_API_DOCS: "yes",
      })
    ).toThrow(/ENABLE_API_DOCS/u)
  })

  it("production 인증 메일은 Resend key와 발신자를 함께 요구하고 secret을 오류에 노출하지 않는다", () => {
    expect(() =>
      parseApiEnv({
        ...createProductionEnvironment(),
        RESEND_API_KEY: undefined,
      })
    ).toThrow(/RESEND_API_KEY, AUTH_EMAIL_FROM/u)
    expect(() =>
      parseApiEnv({
        ...createTestEnvironment(),
        AUTH_EMAIL_FROM: "auth@example.com",
      })
    ).toThrow(/함께 지정/u)

    const secret = "resend-secret-sentinel"
    let thrown: unknown
    try {
      parseApiEnv({
        ...createProductionEnvironment(),
        AUTH_EMAIL_REPLY_TO: "not-an-email",
        RESEND_API_KEY: secret,
      })
    } catch (error) {
      thrown = error
    }

    expect(String(thrown)).toMatch(/AUTH_EMAIL_REPLY_TO/u)
    expect(String(thrown)).not.toContain(secret)
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
    expect(() =>
      parseApiEnv({
        ...createProductionEnvironment(),
        ADMIN_ASSET_PUBLIC_BASE_URL: "http://assets.example.com",
      })
    ).toThrow(/HTTPS/u)
    for (const publicBaseUrl of [
      "https://user:secret@assets.example.com",
      "https://assets.example.com/content?variant=unsafe",
      "https://assets.example.com/content#fragment",
    ]) {
      expect(() =>
        parseApiEnv({
          ...createProductionEnvironment(),
          ADMIN_ASSET_PUBLIC_BASE_URL: publicBaseUrl,
        })
      ).toThrow(/safe public base URL/u)
    }
    expect(
      parseApiEnv({
        ...createTestEnvironment(),
        ADMIN_ASSET_PUBLIC_BASE_URL: "http://localhost:9000/assets",
        ADMIN_ASSET_S3_ACCESS_KEY: "local-access-key",
        ADMIN_ASSET_S3_BUCKET: "local-assets",
        ADMIN_ASSET_S3_ENDPOINT: "http://localhost:9000",
        ADMIN_ASSET_S3_SECRET_KEY: "local-secret-key",
      }).adminAssetStore?.publicBaseUrl
    ).toBe("http://localhost:9000/assets")
    expect(
      parseApiEnv({
        ...createTestEnvironment(),
        ADMIN_ASSET_PUBLIC_BASE_URL: "https://assets.example.com/content///",
        ADMIN_ASSET_S3_ACCESS_KEY: "local-access-key",
        ADMIN_ASSET_S3_BUCKET: "local-assets",
        ADMIN_ASSET_S3_ENDPOINT: "http://localhost:9000",
        ADMIN_ASSET_S3_SECRET_KEY: "local-secret-key",
      }).adminAssetStore?.publicBaseUrl
    ).toBe("https://assets.example.com/content")
    expect(() => {
      const environment = createProductionEnvironment()
      delete environment.ADMIN_ASSET_S3_ACCESS_KEY
      return parseApiEnv(environment)
    }).toThrow(/자료 이미지 저장소 환경 변수/u)
  })

  it("production provider는 필수이고 Google OAuth 설정은 원자적으로 구성한다", () => {
    expect(() =>
      parseApiEnv({
        ...createProductionEnvironment(),
        GOOGLE_CLIENT_SECRET: undefined,
      })
    ).toThrow(/GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET/u)
    expect(() =>
      parseApiEnv({
        ...createProductionEnvironment(),
        OPENAI_API_KEY: undefined,
      })
    ).toThrow(/OPENAI_API_KEY/u)
    expect(() =>
      parseApiEnv({
        ...createTestEnvironment(),
        GOOGLE_CLIENT_ID: "local-google-client",
      })
    ).toThrow(/Google OAuth 설정은 함께/u)
  })

  it("private 삭제 marker 저장소는 production 필수이고 public asset과 분리한다", () => {
    expect(() =>
      parseApiEnv({
        ...createTestEnvironment(),
        DELETION_MARKER_S3_PREFIX: "privacy/local/deletion-markers",
      })
    ).toThrow(/모두 함께/u)
    expect(() =>
      parseApiEnv({
        ...createProductionEnvironment(),
        DELETION_MARKER_S3_SECRET_KEY: undefined,
      })
    ).toThrow(/DELETION_MARKER_S3_SECRET_KEY/u)
    expect(() =>
      parseApiEnv({
        ...createProductionEnvironment(),
        DELETION_MARKER_S3_ENDPOINT: "http://private-s3.example.com",
      })
    ).toThrow(/HTTPS/u)
    expect(() =>
      parseApiEnv({
        ...createProductionEnvironment(),
        DELETION_MARKER_S3_BUCKET: "writing-app-assets",
      })
    ).toThrow(/public asset bucket/u)

    const secret = "marker-secret-sentinel"
    let thrown: unknown
    try {
      parseApiEnv({
        ...createProductionEnvironment(),
        DELETION_MARKER_S3_ACCESS_KEY: undefined,
        DELETION_MARKER_S3_SECRET_KEY: secret,
      })
    } catch (error) {
      thrown = error
    }
    expect(String(thrown)).toMatch(/DELETION_MARKER_S3_ACCESS_KEY/u)
    expect(String(thrown)).not.toContain(secret)
  })
})

function createTestEnvironment(): Record<string, string | undefined> {
  return {
    ADMIN_AUTH_SECRET: adminSecret,
    ADMIN_ORIGIN: "http://localhost:3001",
    API_PORT: "4000",
    DATABASE_URL: ":memory:",
    LEARNER_AUTH_SECRET: learnerSecret,
    NODE_ENV: "test",
    WEB_ORIGIN: "http://localhost:3000",
  }
}

function createProductionEnvironment(): Record<string, string | undefined> {
  return {
    ADMIN_AUTH_SECRET: "FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210",
    ADMIN_ASSET_PUBLIC_BASE_URL: "https://assets.example.com",
    ADMIN_ASSET_S3_ACCESS_KEY: "asset-access-key",
    ADMIN_ASSET_S3_BUCKET: "writing-app-assets",
    ADMIN_ASSET_S3_ENDPOINT: "https://r2.example.com",
    ADMIN_ASSET_S3_SECRET_KEY: "asset-secret-key",
    ADMIN_ORIGIN: "https://admin.example.com",
    CURSOR_SIGNING_SECRET: "a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ1234567890AB",
    DATABASE_URL: "file:/var/lib/writing-app/api.sqlite",
    DELETION_MARKER_S3_ACCESS_KEY: "marker-access-key",
    DELETION_MARKER_S3_BUCKET: "writing-app-deletion-markers",
    DELETION_MARKER_S3_ENDPOINT: "https://private-s3.example.com",
    DELETION_MARKER_S3_REGION: "auto",
    DELETION_MARKER_S3_SECRET_KEY: "marker-secret-key",
    DEPLOYMENT_ENVIRONMENT: "production",
    DEPLOYMENT_VERSION: "api@sha256:test",
    AUTH_EMAIL_FROM: "글결 <auth@example.com>",
    AUTH_EMAIL_REPLY_TO: "support@example.com",
    GOOGLE_CLIENT_ID: "google-production-client-id",
    GOOGLE_CLIENT_SECRET: "google-production-client-secret",
    LEARNER_AUTH_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef",
    NODE_ENV: "production",
    OPENAI_API_KEY: "openai-production-api-key",
    RESEND_API_KEY: "re_production_example",
    WEB_ORIGIN: "https://app.example.com",
  }
}
