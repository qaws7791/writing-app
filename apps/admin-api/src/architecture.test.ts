import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const adminApiSourceRoot = dirname(fileURLToPath(import.meta.url))

describe("apps/admin-api architecture", () => {
  it("admin route wire contract는 contracts package를 직접 import한다", () => {
    const violations = readSourceFiles(resolve(adminApiSourceRoot, "routes"))
      .filter(isRouteFile)
      .flatMap((filePath) => {
        return readNamedImports(filePath)
          .filter(
            ({ importedName, source }) =>
              source === "@workspace/core/admin" &&
              isAdminWireContractName(importedName)
          )
          .map(({ importedName, source }) =>
            formatViolation(filePath, `${source}:${importedName}`)
          )
      })

    expect(violations).toEqual([])
  })

  it("admin route file은 raw Hono sub-app을 만들지 않는다", () => {
    const violations = readSourceFiles(resolve(adminApiSourceRoot, "routes"))
      .filter(isRouteFile)
      .flatMap((filePath) => {
        const imports = readNamedImports(filePath)
          .filter(({ source }) => source === "hono")
          .map(({ importedName, source }) =>
            formatViolation(filePath, `${source}:${importedName}`)
          )
        const instantiations = readSourceText(filePath).includes("new Hono(")
          ? [formatViolation(filePath, "new Hono()")]
          : []

        return [...imports, ...instantiations]
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

function isRouteFile(filePath: string): boolean {
  return filePath.endsWith(".route.ts")
}

function readNamedImports(filePath: string): {
  readonly importedName: string
  readonly source: string
}[] {
  const content = readFileSync(filePath, "utf8")
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )
  const imports: {
    readonly importedName: string
    readonly source: string
  }[] = []

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const source = readStringLiteral(node.moduleSpecifier)

      if (source !== null) {
        pushNamedImports(source, node.importClause?.namedBindings)
      }
    }

    ts.forEachChild(node, visit)
  }

  function pushNamedImports(
    source: string,
    namedBindings: ts.NamedImportBindings | undefined
  ) {
    if (namedBindings === undefined || !ts.isNamedImports(namedBindings)) {
      return
    }

    for (const specifier of namedBindings.elements) {
      imports.push({
        importedName: specifier.propertyName?.text ?? specifier.name.text,
        source,
      })
    }
  }

  visit(sourceFile)

  return imports
}

function readSourceText(filePath: string): string {
  return readFileSync(filePath, "utf8")
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

function isAdminWireContractName(name: string): boolean {
  return (
    name.endsWith("Dto") ||
    name.endsWith("Request") ||
    name.endsWith("Schema") ||
    name.endsWith("Sort") ||
    name.endsWith("Direction") ||
    name.endsWith("StatusFilter")
  )
}

function formatViolation(filePath: string, source: string): string {
  return `${relative(adminApiSourceRoot, filePath).split(sep).join("/")} -> ${source}`
}
