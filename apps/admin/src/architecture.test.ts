import { describe, expect, it } from "vitest"
import { readdirSync } from "node:fs"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import {
  createRepositoryInventory,
  readModuleReferences,
} from "@workspace/repository-tooling"

const adminSourceRoot = dirname(fileURLToPath(import.meta.url))
const courseEditorSourceRoot = resolve(
  adminSourceRoot,
  "features",
  "courses",
  "course-editor"
)

describe("apps/admin architecture", () => {
  it("admin app은 core package를 직접 import하지 않는다", () => {
    const violations = readSourceFiles(adminSourceRoot).flatMap((filePath) => {
      return readImports(filePath)
        .filter(isWorkspaceCoreImport)
        .map((source) => formatViolation(filePath, source))
    })

    expect(violations).toEqual([])
  })

  it("admin app은 제거된 lesson package를 import하지 않는다", () => {
    const violations = readSourceFiles(adminSourceRoot).flatMap((filePath) => {
      return readImports(filePath)
        .filter(isWorkspaceLessonImport)
        .map((source) => formatViolation(filePath, source))
    })

    expect(violations).toEqual([])
  })

  it("admin 화면은 admin wire DTO package를 직접 import하지 않는다", () => {
    const violations = readSourceFiles(adminSourceRoot)
      .filter((filePath) => !isAdminApiBoundaryFile(filePath))
      .flatMap((filePath) => {
        return readImports(filePath)
          .filter((source) => source === "@workspace/contracts/admin")
          .map((source) => formatViolation(filePath, source))
      })

    expect(violations).toEqual([])
  })

  it("삭제된 중앙 관리자 API로 되돌아가지 않는다", () => {
    const legacyImports = [
      "@/lib/api/admin-api",
      "@/lib/api/http-admin-api",
      "@/lib/api/get-server-admin-api",
    ]
    const violations = readSourceFiles(adminSourceRoot).flatMap((filePath) =>
      readImports(filePath)
        .filter((source) => legacyImports.includes(source))
        .map((source) => formatViolation(filePath, source))
    )

    expect(violations).toEqual([])
  })

  it("course editor step form registry는 step-forms barrel만 import한다", () => {
    const registryPath = resolve(
      courseEditorSourceRoot,
      "step-forms",
      "step-form-registry.tsx"
    )
    const violations = readImports(registryPath)
      .filter(isCourseEditorStepFormsDeepImport)
      .map((source) => formatViolation(registryPath, source))

    expect(violations).toEqual([])
  })

  it("course editor step forms는 registry를 import하지 않는다", () => {
    const stepFormsRoot = resolve(courseEditorSourceRoot, "step-forms")
    const violations = readSourceFiles(stepFormsRoot).flatMap((filePath) => {
      return readImports(filePath)
        .filter(isCourseEditorStepFormRegistryImport)
        .map((source) => formatViolation(filePath, source))
    })

    expect(violations).toEqual([])
  })

  it("course editor root에는 shell entrypoint만 둔다", () => {
    const allowedFileNames = new Set([
      "course-editor-shell.test.tsx",
      "course-editor-shell.tsx",
    ])
    const violations = readdirSync(courseEditorSourceRoot, {
      withFileTypes: true,
    })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) => !allowedFileNames.has(fileName))

    expect(violations).toEqual([])
  })
})

function readSourceFiles(rootPath: string): string[] {
  return createRepositoryInventory({ root: rootPath }).map((file) => file.path)
}

function readImports(filePath: string): string[] {
  return readModuleReferences(filePath).map((reference) => reference.source)
}

function isWorkspaceCoreImport(source: string): boolean {
  return source === "@workspace/core" || source.startsWith("@workspace/core/")
}

function isWorkspaceLessonImport(source: string): boolean {
  return (
    source === "@workspace/lesson" || source.startsWith("@workspace/lesson/")
  )
}

function isAdminApiBoundaryFile(filePath: string): boolean {
  const path = relative(adminSourceRoot, filePath).split(sep).join("/")

  return (
    path === "features/analytics/admin-analytics-api.ts" ||
    path === "features/auth/admin-session-api.ts" ||
    path === "features/chat/admin-ai-chat-api.ts" ||
    path === "features/courses/admin-courses-api.ts" ||
    path === "features/dashboard/admin-dashboard-api.ts" ||
    path === "features/resources/resource-event-parser.ts" ||
    path === "features/resources/resource-library-http-adapter.ts" ||
    path === "features/settings/admin-settings-api.ts" ||
    path === "features/users/admin-users-api.ts" ||
    path === "lib/api/admin-identity.ts"
  )
}

function isCourseEditorStepFormsDeepImport(source: string): boolean {
  return (
    source.startsWith("@/features/courses/course-editor/step-forms/") &&
    source !== "@/features/courses/course-editor/step-forms"
  )
}

function isCourseEditorStepFormRegistryImport(source: string): boolean {
  return (
    source === "@/features/courses/course-editor/step-forms/step-form-registry"
  )
}

function formatViolation(filePath: string, source: string): string {
  return `${relative(adminSourceRoot, filePath).split(sep).join("/")} -> ${source}`
}
