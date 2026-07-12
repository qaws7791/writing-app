import { describe, expect, it } from "vitest"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import {
  createRepositoryInventory,
  readModuleReferences,
} from "@workspace/repository-tooling"

const apiSourceRoot = dirname(fileURLToPath(import.meta.url))
const allowedCoreModuleFacades = new Set([
  "ai-feedback",
  "auth",
  "content",
  "learner-api-core",
  "learning",
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
