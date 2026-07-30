import { describe, expect, it } from "vitest"

import {
  readAdminCspRuntimeConfig,
  readAdminWebOrigin,
  readServerApiBaseUrl,
} from "@/server/env/admin-runtime-config"

describe("readServerApiBaseUrl", () => {
  it("서버 전용 API base URL의 경로와 끝 slash를 버리고 origin만 남긴다", () => {
    expect(
      readServerApiBaseUrl({
        API_BASE_URL: "https://api.internal.test/",
        NODE_ENV: "production",
      })
    ).toBe("https://api.internal.test")
  })

  it("서버 내부 통신은 production에서도 HTTP origin을 허용한다", () => {
    expect(
      readServerApiBaseUrl({
        API_BASE_URL: "http://api:4000/",
        NODE_ENV: "production",
      })
    ).toBe("http://api:4000")
  })
})

describe("readAdminWebOrigin", () => {
  it("공개 admin origin의 경로를 버리고 origin만 남긴다", () => {
    expect(
      readAdminWebOrigin({
        ADMIN_ORIGIN: "https://admin.example.test/path",
        NODE_ENV: "production",
      })
    ).toBe("https://admin.example.test")
  })

  it("production 공개 HTTP admin origin을 거부한다", () => {
    expect(() =>
      readAdminWebOrigin({
        ADMIN_ORIGIN: "http://admin.example.test",
        NODE_ENV: "production",
      })
    ).toThrow("production admin web origin must use HTTPS")
  })
})

describe("readAdminCspRuntimeConfig", () => {
  it("admin origin과 report-only 상태를 함께 읽는다", () => {
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

  it("개발에서는 HTTP content asset origin을 image source로 허용한다", () => {
    expect(
      readAdminCspRuntimeConfig({
        ADMIN_ORIGIN: "http://127.0.0.1:3001",
        CONTENT_ASSET_PUBLIC_BASE_URL: "http://127.0.0.1:4199/content-assets",
      }).contentAssetImageSource
    ).toBe("http://127.0.0.1:4199")
  })

  it("production에서는 HTTP content asset base URL을 거부한다", () => {
    expect(() =>
      readAdminCspRuntimeConfig({
        ADMIN_ORIGIN: "https://admin.example.test",
        CONTENT_ASSET_PUBLIC_BASE_URL:
          "http://assets.example.test/content-assets",
        NODE_ENV: "production",
      })
    ).toThrow("content asset public base URL must use HTTPS in production")
  })

  it("build 허용 목록에 있는 production content asset origin만 image source로 쓴다", () => {
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
  })

  it("build 허용 목록 밖의 production content asset origin을 거부한다", () => {
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
