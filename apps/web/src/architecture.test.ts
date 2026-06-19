import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const webSourceRoot = dirname(fileURLToPath(import.meta.url))
const webPackageJsonPath = resolve(webSourceRoot, "../package.json")

describe("apps/web architecture", () => {
  it("web app은 core package를 직접 import하지 않는다", () => {
    const violations = readSourceFiles(webSourceRoot).flatMap((filePath) => {
      return readImports(filePath)
        .filter(isWorkspaceCoreImport)
        .map((source) => formatViolation(filePath, source))
    })

    expect(violations).toEqual([])
  })

  it("web app은 openapi-fetch에 의존하지 않는다", () => {
    const packageDependencies = readPackageDependencies(webPackageJsonPath)
    const importViolations = readSourceFiles(webSourceRoot).flatMap(
      (filePath) => {
        return readImports(filePath)
          .filter(isOpenApiFetchImport)
          .map((source) => formatViolation(filePath, source))
      }
    )

    expect(packageDependencies).not.toContain("openapi-fetch")
    expect(importViolations).toEqual([])
  })
})

function readPackageDependencies(packageJsonPath: string): string[] {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    readonly dependencies?: PackageDependencyMap
    readonly devDependencies?: PackageDependencyMap
  }

  return [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ].sort()
}

type PackageDependencyMap = {
  readonly [dependencyName: string]: string
}

function readSourceFiles(rootPath: string): string[] {
  return readdirSync(rootPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(rootPath, entry.name)

    if (entry.isDirectory()) {
      return readSourceFiles(entryPath)
    }

    if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) {
      return []
    }

    if (entry.name.endsWith(".d.ts")) {
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
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
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

function isOpenApiFetchImport(source: string): boolean {
  return source === "openapi-fetch" || source.startsWith("openapi-fetch/")
}

function formatViolation(filePath: string, source: string): string {
  return `${relative(webSourceRoot, filePath).split(sep).join("/")} -> ${source}`
}
