import { describe, expect, it } from "vitest"

import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import {
  readServerApiBaseUrl,
  readWebCspRuntimeConfig,
  readWebOrigin,
} from "@/server/env/runtime-config"

describe("web server runtime config", () => {
  it("production 서버 API 주소의 로컬 fallback을 거부한다", () => {
    expect(() => readServerApiBaseUrl({ NODE_ENV: "production" })).toThrow(
      "production server API base URL is required"
    )
  })

  it("서버 API base URL을 기본값과 환경 변수에서 명시적으로 읽는다", () => {
    expect(readServerApiBaseUrl({})).toBe(localRuntimeDefaults.apiBaseUrl)
    expect(
      readServerApiBaseUrl({
        API_BASE_URL: "https://internal-api.example.test/",
      })
    ).toBe("https://internal-api.example.test")
    expect(
      readServerApiBaseUrl({
        API_BASE_URL: "http://api:4000/",
        NODE_ENV: "production",
      })
    ).toBe("http://api:4000")
  })

  it("공개 metadata origin은 production에서 명시적으로 요구한다", () => {
    expect(readWebOrigin({})).toBe(localRuntimeDefaults.learnerWebOrigin)
    expect(
      readWebOrigin({
        NODE_ENV: "production",
        WEB_ORIGIN: "https://writing.example.test/path",
      })
    ).toBe("https://writing.example.test")
    expect(() => readWebOrigin({ NODE_ENV: "production" })).toThrow(
      "production web origin is required"
    )
  })

  it("CSP runtime 설정은 web origin과 report-only 상태를 함께 읽는다", () => {
    expect(
      readWebCspRuntimeConfig({
        CSP_REPORT_ONLY: "true",
        NODE_ENV: "production",
        WEB_ORIGIN: "https://writing.example.test",
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
      readWebCspRuntimeConfig({
        NODE_ENV: "production",
        WEB_ORIGIN: "http://localhost:3000",
      })
    ).toEqual({
      contentAssetImageSource: null,
      development: false,
      reportOnly: false,
      upgradeInsecureRequests: false,
    })
  })

  it("production 공개 HTTP origin을 거부한다", () => {
    expect(() =>
      readWebOrigin({
        NODE_ENV: "production",
        WEB_ORIGIN: "http://writing.example.test",
      })
    ).toThrow("production web origin must use HTTPS")
  })

  it("content asset origin은 개발 HTTP를 허용하고 production에서 HTTPS를 강제한다", () => {
    expect(
      readWebCspRuntimeConfig({
        CONTENT_ASSET_PUBLIC_BASE_URL: "http://127.0.0.1:4199/content-assets",
        WEB_ORIGIN: "http://localhost:3000",
      }).contentAssetImageSource
    ).toBe("http://127.0.0.1:4199")
    expect(() =>
      readWebCspRuntimeConfig({
        CONTENT_ASSET_PUBLIC_BASE_URL:
          "http://assets.example.test/content-assets",
        NODE_ENV: "production",
        WEB_ORIGIN: "https://writing.example.test",
      })
    ).toThrow("content asset public base URL must use HTTPS in production")
  })

  it("production content asset origin은 build 허용 목록과 일치해야 한다", () => {
    expect(
      readWebCspRuntimeConfig({
        CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS:
          "https://staging-assets.example.test,https://assets.example.test",
        CONTENT_ASSET_PUBLIC_BASE_URL:
          "https://assets.example.test/content-assets",
        NODE_ENV: "production",
        WEB_ORIGIN: "https://writing.example.test",
      }).contentAssetImageSource
    ).toBe("https://assets.example.test")
    expect(() =>
      readWebCspRuntimeConfig({
        CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS:
          "https://staging-assets.example.test,https://assets.example.test",
        CONTENT_ASSET_PUBLIC_BASE_URL:
          "https://unknown-assets.example.test/content-assets",
        NODE_ENV: "production",
        WEB_ORIGIN: "https://writing.example.test",
      })
    ).toThrow(
      "content asset public base URL origin is not in the image allowlist"
    )
  })
})
