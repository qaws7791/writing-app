import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import {
  buildApiUrl,
  readBrowserApiBaseUrl,
} from "@/shared/config/runtime-config"

describe("web runtime config", () => {
  it("브라우저 API base URL을 기본값과 환경 변수에서 명시적으로 읽는다", () => {
    expect(readBrowserApiBaseUrl({})).toBe(localRuntimeDefaults.apiBaseUrl)
    expect(
      readBrowserApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test///",
      })
    ).toBe("https://api.example.test")
  })

  it("production 브라우저 API 주소의 로컬 fallback을 거부한다", () => {
    expect(() => readBrowserApiBaseUrl({ NODE_ENV: "production" })).toThrow(
      "production API base URL is required"
    )
    expect(() =>
      readBrowserApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "http://api.example.test",
        NODE_ENV: "production",
      })
    ).toThrow("production public API base URL must use HTTPS")
    expect(
      readBrowserApiBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000",
        NODE_ENV: "production",
      })
    ).toBe("http://localhost:4000")
  })

  it("API path를 같은 규칙으로 조합한다", () => {
    expect(buildApiUrl(readBrowserApiBaseUrl({}), "/api/auth/sign-out")).toBe(
      `${localRuntimeDefaults.apiBaseUrl}/api/auth/sign-out`
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

  it("runtime config 밖의 실행 코드가 runtime env를 직접 읽지 않는다", () => {
    const runtimeConfigSource = readFileSync(
      join(process.cwd(), "src/shared/config/runtime-config.ts"),
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

      return /process\.env(?:\[['"](?:NEXT_PUBLIC_API_BASE_URL|API_BASE_URL|ENABLE_TEST_AUTH)['"]\]|\.(?:NEXT_PUBLIC_API_BASE_URL|API_BASE_URL|ENABLE_TEST_AUTH))/.test(
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

const webDirectory = join(import.meta.dirname, "../../..")
