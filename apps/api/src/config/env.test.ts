import { describe, expect, it } from "vitest"

import { parseApiEnv } from "@/config/env"

const validProductionEnvironment: Record<string, string | undefined> = {
  ADMIN_AUTH_SECRET: "FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210",
  ADMIN_ORIGIN: "https://admin.example.com",
  AUTH_EMAIL_FROM: "auth@example.com",
  AUTH_EMAIL_REPLY_TO: "support@example.com",
  CURSOR_SIGNING_SECRET: "a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ1234567890AB",
  DEPLOYMENT_ENVIRONMENT: "production",
  DEPLOYMENT_VERSION: "api@sha256:test",
  GOOGLE_CLIENT_ID: "google-production-client-id",
  GOOGLE_CLIENT_SECRET: "google-production-client-secret",
  LEARNER_AUTH_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef",
  NODE_ENV: "production",
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

  it("운영 발신 주소 누락을 거부한다", () => {
    expect(() =>
      parseApiEnv({ ...validProductionEnvironment, AUTH_EMAIL_FROM: undefined })
    ).toThrow(/AUTH_EMAIL_FROM/u)
  })
})
