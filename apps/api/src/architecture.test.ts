import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const apiSourceRoot = dirname(fileURLToPath(import.meta.url))
const allowedCoreModuleFacades = new Set([
  "ai-feedback",
  "auth",
  "content",
  "learner-api",
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
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )
  const imports: string[] = []

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      pushImport(node.moduleSpecifier)
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      pushImport(node.arguments[0])
    }

    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      pushImport(node.argument.literal)
    }

    ts.forEachChild(node, visit)
  }

  function pushImport(node: ts.Node | undefined) {
    const source = readStringLiteral(node)

    if (source !== null) {
      imports.push(source)
    }
  }

  visit(sourceFile)

  return imports
}

function readStringLiteral(node: ts.Node | undefined): string | null {
  if (
    node !== undefined &&
    (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
  ) {
    return node.text
  }

  return null
}

function isWorkspaceCoreImport(source: string): boolean {
  return source === "@workspace/core" || source.startsWith("@workspace/core/")
}

function isAllowedCoreModuleFacadeImport(source: string): boolean {
  const prefix = "@workspace/core/modules/"

  if (!source.startsWith(prefix)) {
    return false
  }

  const modulePath = source.slice(prefix.length)

  return (
    allowedCoreModuleFacades.has(modulePath) ||
    (modulePath.endsWith("/api") &&
      allowedCoreModuleFacades.has(modulePath.slice(0, -"/api".length)))
  )
}

function isHttpContractSchemaFile(filePath: string): boolean {
  const relativePath = relative(apiSourceRoot, filePath)
  const parts = relativePath.split(sep)

  return (
    (parts[0] === "http" && parts[1] === "openapi.ts") ||
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
