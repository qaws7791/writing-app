import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import {
  createAdminLoginPath,
  resolveSafeAdminNextPath,
} from "@/lib/auth/admin-auth-navigation"

describe("admin auth navigation", () => {
  it("로그인 next 경로를 내부 경로로만 제한한다", () => {
    expect(resolveSafeAdminNextPath("/courses")).toBe("/courses")
    expect(resolveSafeAdminNextPath("//evil.example")).toBe("/")
    expect(resolveSafeAdminNextPath("/\\evil.example")).toBe("/")
    expect(resolveSafeAdminNextPath("https://evil.example")).toBe("/")
    expect(resolveSafeAdminNextPath("/login?next=/courses")).toBe("/")
    expect(resolveSafeAdminNextPath("/courses%0Aevil")).toBe("/")
    expect(createAdminLoginPath("/courses")).toBe("/login?next=%2Fcourses")
  })

  it("어드민 앱 source에서 native window.location 이동을 사용하지 않는다", () => {
    const sourceFiles = readSourceFiles(
      join(import.meta.dirname, "../../..", "src")
    )
    const forbiddenPattern =
      /window\\.location\\.(assign|replace|href)|location\\.(assign|replace|href)/
    const offenders = sourceFiles.filter((file) =>
      forbiddenPattern.test(file.content)
    )

    expect(offenders.map((file) => file.path)).toEqual([])
  })
})

function readSourceFiles(directory: string): readonly {
  readonly content: string
  readonly path: string
}[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return readSourceFiles(entryPath)
    }

    if (
      !entry.isFile() ||
      !entry.name.match(/\\.(ts|tsx)$/) ||
      entry.name.endsWith(".test.ts") ||
      entry.name.endsWith(".test.tsx")
    ) {
      return []
    }

    return [
      {
        content: readFileSync(entryPath, "utf8"),
        path: entryPath,
      },
    ]
  })
}
