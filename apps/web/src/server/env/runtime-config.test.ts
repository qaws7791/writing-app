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

  it("CSP runtime 설정은 공개 API origin과 report-only 상태를 함께 읽는다", () => {
    expect(
      readWebCspRuntimeConfig({
        CSP_REPORT_ONLY: "true",
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test/path",
        NODE_ENV: "production",
      })
    ).toEqual({
      apiOrigin: "https://api.example.test",
      development: false,
      reportOnly: true,
    })
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
