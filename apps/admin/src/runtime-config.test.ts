import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"
import { localRuntimeDefaults } from "@workspace/env"

import {
  buildAdminApiUrl,
  buildAdminApiWebSocketUrl,
  readAdminApiBaseUrl,
  readLearnerWebOrigin,
} from "@/runtime-config"
import {
  readAdminWebOrigin,
  readServerAdminApiBaseUrl,
} from "@/runtime-config-server"

describe("admin runtime config", () => {
  it("어드민 API base URL을 기본값과 환경 변수에서 명시적으로 읽는다", () => {
    expect(readAdminApiBaseUrl({})).toBe(localRuntimeDefaults.adminApiBaseUrl)
    expect(
      readAdminApiBaseUrl({
        NEXT_PUBLIC_ADMIN_API_BASE_URL: "https://admin-api.example.test///",
      })
    ).toBe("https://admin-api.example.test")
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
    expect(
      buildAdminApiWebSocketUrl(
        readAdminApiBaseUrl({
          NEXT_PUBLIC_ADMIN_API_BASE_URL: "https://admin-api.example.test///",
        }),
        "/resources/events"
      )
    ).toBe("wss://admin-api.example.test/resources/events")
  })

  it("runtime config 밖의 실행 코드가 어드민 API base URL env를 직접 읽지 않는다", () => {
    const runtimeConfigSource = readFileSync(
      join(process.cwd(), "src/runtime-config.ts"),
      "utf8"
    )
    expect(runtimeConfigSource).toContain(
      "process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL"
    )
    const offenders = findRuntimeSourceFiles().filter((filePath) => {
      if (filePath.endsWith("runtime-config.ts")) {
        return false
      }

      const source = readFileSync(filePath, "utf8")

      return /process\.env(?:\[['"]ADMIN_API_BASE_URL['"]\]|\.ADMIN_API_BASE_URL)/.test(
        source
      )
    })

    expect(
      offenders.map((filePath) => relative(process.cwd(), filePath))
    ).toEqual([])
  })
})

function findRuntimeSourceFiles(
  directory = join(process.cwd(), "src")
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
