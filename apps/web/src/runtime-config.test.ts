import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"
import { localRuntimeDefaults } from "@workspace/env"

import { buildApiUrl, readBrowserApiBaseUrl } from "@/runtime-config"
import {
  readServerApiBaseUrl,
  readTestAuthEnabled,
  readWebCspRuntimeConfig,
  readWebOrigin,
} from "@/runtime-config-server"

describe("web runtime config", () => {
  it("브라우저 API base URL을 기본값과 환경 변수에서 명시적으로 읽는다", () => {
    expect(readBrowserApiBaseUrl({})).toBe(
      localRuntimeDefaults.learnerApiBaseUrl
    )
    expect(
      readBrowserApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test///",
      })
    ).toBe("https://api.example.test")
  })

  it("production 브라우저와 서버 API 주소의 로컬 fallback을 거부한다", () => {
    expect(() => readBrowserApiBaseUrl({ NODE_ENV: "production" })).toThrow(
      "production API base URL is required"
    )
    expect(() => readServerApiBaseUrl({ NODE_ENV: "production" })).toThrow(
      "production server API base URL is required"
    )
  })

  it("서버 API base URL을 기본값과 환경 변수에서 명시적으로 읽는다", () => {
    expect(readServerApiBaseUrl({})).toBe(
      localRuntimeDefaults.learnerApiBaseUrl
    )
    expect(
      readServerApiBaseUrl({
        WEB_API_BASE_URL: "https://internal-api.example.test/",
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

  it("API path를 같은 규칙으로 조합한다", () => {
    expect(buildApiUrl(readBrowserApiBaseUrl({}), "/api/auth/sign-out")).toBe(
      `${localRuntimeDefaults.learnerApiBaseUrl}/api/auth/sign-out`
    )
    expect(
      buildApiUrl(
        readBrowserApiBaseUrl({
          NEXT_PUBLIC_API_BASE_URL: "https://api.example.test///",
        }),
        "profile"
      )
    ).toBe("https://api.example.test/profile")
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

  it("runtime config 밖의 실행 코드가 runtime env를 직접 읽지 않는다", () => {
    const runtimeConfigSource = readFileSync(
      join(process.cwd(), "src/runtime-config.ts"),
      "utf8"
    )
    expect(runtimeConfigSource).toContain(
      "process.env.NEXT_PUBLIC_API_BASE_URL"
    )
    const offenders = findRuntimeSourceFiles().filter((filePath) => {
      if (filePath.endsWith("runtime-config.ts")) {
        return false
      }

      const source = readFileSync(filePath, "utf8")

      return /process\.env(?:\[['"](?:NEXT_PUBLIC_API_BASE_URL|WEB_API_BASE_URL|ENABLE_TEST_AUTH)['"]\]|\.(?:NEXT_PUBLIC_API_BASE_URL|WEB_API_BASE_URL|ENABLE_TEST_AUTH))/.test(
        source
      )
    })

    expect(
      offenders.map((filePath) => relative(webDirectory, filePath))
    ).toEqual([])
  })
})

function findRuntimeSourceFiles(
  directory = join(webDirectory, "src")
): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return findRuntimeSourceFiles(entryPath)
    }

    if (
      entry.name.endsWith(".test.ts") ||
      entry.name.endsWith(".test.tsx") ||
      (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx"))
    ) {
      return []
    }

    return [entryPath]
  })
}

const webDirectory = join(import.meta.dirname, "..")
