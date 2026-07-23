import { describe, expect, it } from "vitest"

import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import {
  readServerApiBaseUrl,
  readTestAuthEnabled,
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

  it("테스트 인증 플래그는 로컬에서 명시적으로 켠 경우에만 활성화한다", () => {
    expect(readTestAuthEnabled({})).toBe(false)
    expect(
      readTestAuthEnabled({
        ENABLE_TEST_AUTH: "true",
        NODE_ENV: "development",
      })
    ).toBe(true)
    expect(
      readTestAuthEnabled({
        ENABLE_TEST_AUTH: "true",
        NODE_ENV: "production",
      })
    ).toBe(false)
  })
})
