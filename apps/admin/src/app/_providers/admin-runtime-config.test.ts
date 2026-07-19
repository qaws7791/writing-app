import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import {
  buildAdminApiUrl,
  readAdminApiBaseUrl,
  readLearnerWebOrigin,
} from "@/shared/config/admin-runtime-config"
import {
  readAdminCspRuntimeConfig,
  readAdminWebOrigin,
  readServerAdminApiBaseUrl,
} from "@/server/env/admin-runtime-config"

describe("admin runtime config", () => {
  it("어드민 API base URL을 기본값과 환경 변수에서 명시적으로 읽는다", () => {
    expect(readAdminApiBaseUrl({})).toBe(localRuntimeDefaults.adminApiBaseUrl)
    expect(
      readAdminApiBaseUrl({
        NEXT_PUBLIC_ADMIN_API_BASE_URL: "https://admin-api.example.test///",
      })
    ).toBe("https://admin-api.example.test")
    expect(
      readAdminApiBaseUrl({
        ADMIN_API_BASE_URL: "https://private.example.test",
      })
    ).toBe(localRuntimeDefaults.adminApiBaseUrl)
    expect(readLearnerWebOrigin({})).toBe(localRuntimeDefaults.learnerWebOrigin)
  })

  it("브라우저 전역 없이 development 기본값을 읽는다", () => {
    expect(
      readFileSync(
        join(process.cwd(), "src/shared/config/admin-runtime-config.ts"),
        "utf8"
      )
    ).not.toContain("window")
  })

  it("production 브라우저 공개 주소의 로컬 fallback을 거부한다", () => {
    expect(() => readAdminApiBaseUrl({ NODE_ENV: "production" })).toThrow(
      "production admin API base URL is required"
    )
    expect(() => readLearnerWebOrigin({ NODE_ENV: "production" })).toThrow(
      "production learner web origin is required"
    )
  })

  it("서버 전용 API와 admin origin을 공개 브라우저 계약과 분리한다", () => {
    expect(
      readServerAdminApiBaseUrl({
        ADMIN_API_BASE_URL: "https://admin-api.internal.test/",
        NODE_ENV: "production",
      })
    ).toBe("https://admin-api.internal.test")
    expect(
      readAdminWebOrigin({
        ADMIN_ORIGIN: "https://admin.example.test/path",
        NODE_ENV: "production",
      })
    ).toBe("https://admin.example.test")
  })

  it("CSP runtime 설정은 공개 admin API와 report-only 상태를 함께 읽는다", () => {
    expect(
      readAdminCspRuntimeConfig({
        CSP_REPORT_ONLY: "true",
        NEXT_PUBLIC_ADMIN_API_BASE_URL: "https://admin-api.example.test/path",
        NODE_ENV: "production",
      })
    ).toEqual({
      apiOrigin: "https://admin-api.example.test",
      development: false,
      reportOnly: true,
    })
  })

  it("어드민 API path를 같은 규칙으로 조합한다", () => {
    expect(
      buildAdminApiUrl(readAdminApiBaseUrl({}), "/api/auth/sign-in/email")
    ).toBe(`${localRuntimeDefaults.adminApiBaseUrl}/api/auth/sign-in/email`)
    expect(
      buildAdminApiUrl(
        readAdminApiBaseUrl({
          NEXT_PUBLIC_ADMIN_API_BASE_URL: "https://admin-api.example.test///",
        }),
        "settings"
      )
    ).toBe("https://admin-api.example.test/settings")
  })

  it("runtime config 밖의 실행 코드가 어드민 API base URL env를 직접 읽지 않는다", () => {
    const runtimeConfigSource = readFileSync(
      join(process.cwd(), "src/shared/config/admin-runtime-config.ts"),
      "utf8"
    )
    expect(runtimeConfigSource).toContain("env ?? process.env")
    const offenders = findRuntimeSourceFiles().filter((filePath) => {
      if (filePath.endsWith("admin-runtime-config.ts")) {
        return false
      }

      const source = readFileSync(filePath, "utf8")

      return /process\.env(?:\[['"]ADMIN_API_BASE_URL['"]\]|\.ADMIN_API_BASE_URL)/.test(
        source
      )
    })

    expect(
      offenders.map((filePath) => relative(adminDirectory, filePath))
    ).toEqual([])
  })
})

function findRuntimeSourceFiles(
  directory = join(adminDirectory, "src")
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

const adminDirectory = join(import.meta.dirname, "../../..")
