import { describe, expect, it } from "vitest"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import { buildApiUrl } from "@/shared/config/api-base-url"
import { readLearnerWebOrigin } from "@/shared/config/admin-runtime-config"
import {
  readAdminCspRuntimeConfig,
  readAdminWebOrigin,
  readServerApiBaseUrl,
} from "@/server/env/admin-runtime-config"

describe("admin runtime config", () => {
  it("학습자 공개 origin을 명시적으로 읽는다", () => {
    expect(readLearnerWebOrigin({})).toBe(localRuntimeDefaults.learnerWebOrigin)
  })

  it("production 브라우저 공개 주소의 로컬 fallback을 거부한다", () => {
    expect(() => readLearnerWebOrigin({ NODE_ENV: "production" })).toThrow(
      "production learner web origin is required"
    )
    expect(() =>
      readLearnerWebOrigin({
        NEXT_PUBLIC_LEARNER_WEB_ORIGIN: "http://writing.example.test",
        NODE_ENV: "production",
      })
    ).toThrow("production learner web origin must use HTTPS")
  })

  it("서버 전용 API와 admin origin을 공개 브라우저 계약과 분리한다", () => {
    expect(
      readServerApiBaseUrl({
        API_BASE_URL: "https://api.internal.test/",
        NODE_ENV: "production",
      })
    ).toBe("https://api.internal.test")
    expect(
      readAdminWebOrigin({
        ADMIN_ORIGIN: "https://admin.example.test/path",
        NODE_ENV: "production",
      })
    ).toBe("https://admin.example.test")
    expect(
      readServerApiBaseUrl({
        API_BASE_URL: "http://api:4000/",
        NODE_ENV: "production",
      })
    ).toBe("http://api:4000")
  })

  it("CSP runtime 설정은 admin origin과 report-only 상태를 함께 읽는다", () => {
    expect(
      readAdminCspRuntimeConfig({
        ADMIN_ORIGIN: "https://admin.example.test",
        CSP_REPORT_ONLY: "true",
        NODE_ENV: "production",
      })
    ).toEqual({
      contentAssetImageSource: null,
      development: false,
      reportOnly: true,
      upgradeInsecureRequests: true,
    })
  })

  it("production localhost에서는 엄격한 CSP를 유지하고 HTTP 승격만 끈다", () => {
    expect(
      readAdminCspRuntimeConfig({
        ADMIN_ORIGIN: "http://admin.localhost:3001",
        NODE_ENV: "production",
      })
    ).toEqual({
      contentAssetImageSource: null,
      development: false,
      reportOnly: false,
      upgradeInsecureRequests: false,
    })
  })

  it("production 공개 HTTP admin origin을 거부한다", () => {
    expect(() =>
      readAdminWebOrigin({
        ADMIN_ORIGIN: "http://admin.example.test",
        NODE_ENV: "production",
      })
    ).toThrow("production admin web origin must use HTTPS")
  })

  it("브라우저 API path는 상대 경로로 조합한다", () => {
    expect(buildApiUrl(undefined, "/api/admin/auth/sign-in/email")).toBe(
      "/api/admin/auth/sign-in/email"
    )
    expect(buildApiUrl(undefined, "api/admin/courses")).toBe(
      "/api/admin/courses"
    )
  })

  it("content asset origin은 개발 HTTP를 허용하고 production에서 HTTPS를 강제한다", () => {
    expect(
      readAdminCspRuntimeConfig({
        ADMIN_ORIGIN: "http://127.0.0.1:3001",
        CONTENT_ASSET_PUBLIC_BASE_URL: "http://127.0.0.1:4199/content-assets",
      }).contentAssetImageSource
    ).toBe("http://127.0.0.1:4199")
    expect(() =>
      readAdminCspRuntimeConfig({
        ADMIN_ORIGIN: "https://admin.example.test",
        CONTENT_ASSET_PUBLIC_BASE_URL:
          "http://assets.example.test/content-assets",
        NODE_ENV: "production",
      })
    ).toThrow("content asset public base URL must use HTTPS in production")
  })

  it("production content asset origin은 build 허용 목록과 일치해야 한다", () => {
    expect(
      readAdminCspRuntimeConfig({
        ADMIN_ORIGIN: "https://admin.example.test",
        CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS:
          "https://staging-assets.example.test,https://assets.example.test",
        CONTENT_ASSET_PUBLIC_BASE_URL:
          "https://assets.example.test/content-assets",
        NODE_ENV: "production",
      }).contentAssetImageSource
    ).toBe("https://assets.example.test")
    expect(() =>
      readAdminCspRuntimeConfig({
        ADMIN_ORIGIN: "https://admin.example.test",
        CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS:
          "https://staging-assets.example.test,https://assets.example.test",
        CONTENT_ASSET_PUBLIC_BASE_URL:
          "https://unknown-assets.example.test/content-assets",
        NODE_ENV: "production",
      })
    ).toThrow(
      "content asset public base URL origin is not in the image allowlist"
    )
  })
})
