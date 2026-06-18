import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const apiSourceRoot = dirname(fileURLToPath(import.meta.url))

describe("apps/api architecture", () => {
  it("core public module facade만 import한다", () => {
    const violations = readSourceFiles(apiSourceRoot).flatMap((filePath) => {
      return readImports(filePath)
        .filter(
          (source) =>
            source.startsWith("@workspace/core/") &&
            !source.startsWith("@workspace/core/modules/")
        )
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
  return readdirSync(rootPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(rootPath, entry.name)

    if (entry.isDirectory()) {
      return readSourceFiles(entryPath)
    }

    if (!entry.name.endsWith(".ts") || entry.name.endsWith(".d.ts")) {
      return []
    }

    return [entryPath]
  })
}

function readImports(filePath: string): string[] {
  const content = readFileSync(filePath, "utf8")
  const imports: string[] = []
  const importPattern =
    /\b(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g

  for (const match of content.matchAll(importPattern)) {
    const source = match[1] ?? match[2]

    if (source !== undefined) {
      imports.push(source)
    }
  }

  return imports
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
