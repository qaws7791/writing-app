import { describe, expect, it } from "vitest"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import {
  createRepositoryInventory,
  readModuleReferences,
} from "@workspace/repository-tooling"

const apiSourceRoot = dirname(fileURLToPath(import.meta.url))
const allowedCoreModuleFacades = new Set([
  "admin",
  "ai-feedback",
  "auth",
  "content",
  "learning",
  "resource-library",
])
const targetRouteTestPaths = [
  "modules/admin-ai-chat/admin-ai-chat.routes.test.ts",
  "modules/admin-content/admin-content.routes.test.ts",
  "modules/admin-dashboard-analytics/admin-dashboard-analytics.routes.test.ts",
  "modules/admin-identity/admin-identity.routes.test.ts",
  "modules/admin-resource-library/admin-resource-library.routes.test.ts",
  "modules/admin-settings/admin-settings.routes.test.ts",
]
const targetContractHarnessSources = new Set([
  "@/test-support/admin-target-contract-fixtures",
  "@/test-support/admin-target-contract-harness",
  "@/test-support/admin-target-contract-runner",
])

describe("apps/api architecture", () => {
  it("core public module facade만 import한다", () => {
    const violations = readSourceFiles(apiSourceRoot).flatMap((filePath) => {
      return readImports(filePath)
        .filter(
          (source) =>
            isWorkspaceCoreImport(source) &&
            !isAllowedCoreModuleFacadeImport(source)
        )
        .map((source) => formatViolation(filePath, source))
    })

    expect(violations).toEqual([])
  })

  it("HTTP contract schema는 contracts package를 직접 import한다", () => {
    const violations = readSourceFiles(apiSourceRoot)
      .filter(isHttpContractSchemaFile)
      .flatMap((filePath) => {
        return readImports(filePath)
          .filter(isWorkspaceCoreImport)
          .map((source) => formatViolation(filePath, source))
      })

    expect(violations).toEqual([])
  })

  it("HTTP surface module끼리 sibling import하지 않는다", () => {
    const violations = readSourceFiles(resolve(apiSourceRoot, "modules"))
      .filter((filePath) => !filePath.endsWith(".test.ts"))
      .flatMap((filePath) => {
        const currentModule = readApiModuleName(filePath)

        if (currentModule === null) {
          return []
        }

        return readImports(filePath)
          .map((source) => ({
            moduleName: readImportedApiModuleName(filePath, source),
            source,
          }))
          .filter(
            ({ moduleName }) =>
              moduleName !== null && moduleName !== currentModule
          )
          .map(({ source }) => formatViolation(filePath, source))
      })

    expect(violations).toEqual([])
  })

  it("direct target route test는 subprocess target contract harness를 import하지 않는다", () => {
    const violations = targetRouteTestPaths.flatMap((relativePath) => {
      const filePath = resolve(apiSourceRoot, relativePath)

      return readImports(filePath)
        .filter((source) => targetContractHarnessSources.has(source))
        .map((source) => formatViolation(filePath, source))
    })

    expect(violations).toEqual([])
  })

  it("production database client 생성은 api-runtime composition root만 소유한다", () => {
    const violations = createRepositoryInventory({ root: apiSourceRoot })
      .filter((file) => isProductionApiSource(file.relativePath))
      .flatMap((file) =>
        file.references
          .filter(
            (reference) =>
              reference.source.startsWith("@workspace/db") &&
              reference.importedNames.includes("createWritingAppDatabase") &&
              file.relativePath !== "api-runtime.ts"
          )
          .map((reference) => formatViolation(file.path, reference.source))
      )

    expect(violations).toEqual([])
  })

  it("AI chat persistence adapter는 provider를 import하지 않는다", () => {
    const violations = readSourceFiles(
      resolve(apiSourceRoot, "adapters/ai-chat")
    )
      .filter((filePath) => filePath.endsWith(".repository.ts"))
      .flatMap((filePath) =>
        readImports(filePath)
          .filter(isAiProviderSource)
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("AI chat route는 persistence adapter를 직접 import하지 않는다", () => {
    const routePath = resolve(
      apiSourceRoot,
      "modules/admin-ai-chat/admin-ai-chat.routes.ts"
    )
    const violations = readImports(routePath)
      .filter((source) => source.startsWith("@/adapters/ai-chat/"))
      .map((source) => formatViolation(routePath, source))

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

function isAllowedCoreModuleFacadeImport(source: string): boolean {
  const prefix = "@workspace/core/"

  if (!source.startsWith(prefix)) {
    return false
  }

  const modulePath = source.slice(prefix.length)

  return allowedCoreModuleFacades.has(modulePath)
}

function isProductionApiSource(relativePath: string): boolean {
  return (
    !relativePath.endsWith(".test.ts") &&
    !relativePath.endsWith(".typecheck.ts") &&
    !relativePath.startsWith("scripts/") &&
    !relativePath.startsWith("test-support/")
  )
}

function isAiProviderSource(source: string): boolean {
  return (
    source === "openai" ||
    source.startsWith("openai/") ||
    source.startsWith("@mastra/") ||
    source.startsWith("@/adapters/ai-chat/admin-content-agent")
  )
}

function isHttpContractSchemaFile(filePath: string): boolean {
  const relativePath = relative(apiSourceRoot, filePath)
  const parts = relativePath.split(sep)

  return (
    (parts[0] === "http" &&
      (parts[1] === "openapi.ts" ||
        (parts[1]?.endsWith(".schemas.ts") ?? false))) ||
    (parts[0] === "modules" &&
      parts.length === 3 &&
      (parts[2]?.endsWith(".schemas.ts") ?? false))
  )
}

function readApiModuleName(filePath: string): string | null {
  const relativePath = relative(apiSourceRoot, filePath)
  const parts = relativePath.split(sep)

  return parts[0] === "modules" ? (parts[1] ?? null) : null
}

function readImportedApiModuleName(
  importerPath: string,
  source: string
): string | null {
  if (source.startsWith("@/modules/")) {
    return source.split("/")[2] ?? null
  }

  if (!source.startsWith(".")) {
    return null
  }

  const importedPath = resolve(dirname(importerPath), source)
  const relativePath = relative(apiSourceRoot, importedPath)
  const parts = relativePath.split(sep)

  return parts[0] === "modules" ? (parts[1] ?? null) : null
}

function formatViolation(filePath: string, source: string): string {
  return `${relative(apiSourceRoot, filePath)} -> ${source}`
}
