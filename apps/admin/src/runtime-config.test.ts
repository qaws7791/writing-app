import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"
import { localRuntimeDefaults } from "@workspace/env"

import {
  buildAdminApiUrl,
  buildAdminApiWebSocketUrl,
  readAdminApiBaseUrl,
} from "@/runtime-config"

describe("admin runtime config", () => {
  it("어드민 API base URL을 기본값과 환경 변수에서 명시적으로 읽는다", () => {
    expect(readAdminApiBaseUrl({})).toBe(localRuntimeDefaults.adminApiBaseUrl)
    expect(
      readAdminApiBaseUrl({
        ADMIN_API_BASE_URL: "https://admin-api.example.test///",
      })
    ).toBe("https://admin-api.example.test")
  })

  it("어드민 API path를 같은 규칙으로 조합한다", () => {
    expect(
      buildAdminApiUrl(readAdminApiBaseUrl({}), "/api/auth/sign-in/email")
    ).toBe(`${localRuntimeDefaults.adminApiBaseUrl}/api/auth/sign-in/email`)
    expect(
      buildAdminApiUrl(
        readAdminApiBaseUrl({
          ADMIN_API_BASE_URL: "https://admin-api.example.test///",
        }),
        "settings"
      )
    ).toBe("https://admin-api.example.test/settings")
    expect(
      buildAdminApiWebSocketUrl(
        readAdminApiBaseUrl({
          ADMIN_API_BASE_URL: "https://admin-api.example.test///",
        }),
        "/resources/collaboration"
      )
    ).toBe("wss://admin-api.example.test/resources/collaboration")
  })

  it("runtime config 밖의 실행 코드가 어드민 API base URL env를 직접 읽지 않는다", () => {
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
