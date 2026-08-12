import { describe, expect, it } from "vitest"

import { parseApiEnv } from "@/config/env"

const validProductionEnvironment: Record<string, string | undefined> = {
  ADMIN_AUTH_SECRET: "FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210",
  ADMIN_ASSET_PUBLIC_BASE_URL: "https://assets.example.com",
  ADMIN_ASSET_S3_ACCESS_KEY: "asset-access-key",
  ADMIN_ASSET_S3_BUCKET: "writing-app-assets",
  ADMIN_ASSET_S3_ENDPOINT: "https://r2.example.com",
  ADMIN_ASSET_S3_REGION: "auto",
  ADMIN_ASSET_S3_SECRET_KEY: "asset-secret-key",
  ADMIN_ORIGIN: "https://admin.example.com",
  AUTH_EMAIL_FROM: "글결 <auth@example.com>",
  AUTH_EMAIL_REPLY_TO: "support@example.com",
  CURSOR_SIGNING_SECRET: "a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ1234567890AB",
  DATABASE_URL: "file:/var/lib/writing-app/api.sqlite",
  DELETION_MARKER_S3_ACCESS_KEY: "marker-access-key",
  DELETION_MARKER_S3_BUCKET: "writing-app-deletion-markers",
  DELETION_MARKER_S3_ENDPOINT: "https://private-s3.example.com",
  DELETION_MARKER_S3_PREFIX: "privacy/deletion-markers",
  DELETION_MARKER_S3_REGION: "auto",
  DELETION_MARKER_S3_SECRET_KEY: "marker-secret-key",
  DEPLOYMENT_ENVIRONMENT: "production",
  DEPLOYMENT_VERSION: "api@sha256:test",
  GOOGLE_CLIENT_ID: "google-production-client-id",
  GOOGLE_CLIENT_SECRET: "google-production-client-secret",
  LEARNER_AUTH_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef",
  NODE_ENV: "production",
  RESEND_API_KEY: "re_production_example",
  WEB_ORIGIN: "https://app.example.com",
}

describe("production API 환경 검증", () => {
  it.each([
    [
      "Google OAuth",
      { GOOGLE_CLIENT_ID: undefined, GOOGLE_CLIENT_SECRET: undefined },
      /GOOGLE_CLIENT_ID/u,
    ],
  ] as const)("%s provider 설정 누락을 거부한다", (_, override, error) => {
    expect(() =>
      parseApiEnv({ ...validProductionEnvironment, ...override })
    ).toThrow(error)
  })

  it("private 삭제 marker와 public asset이 같은 bucket을 사용하면 거부한다", () => {
    expect(() =>
      parseApiEnv({
        ...validProductionEnvironment,
        DELETION_MARKER_S3_BUCKET:
          validProductionEnvironment.ADMIN_ASSET_S3_BUCKET,
      })
    ).toThrow(/DELETION_MARKER_S3_BUCKET/u)
  })
})
