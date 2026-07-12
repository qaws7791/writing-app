import { describe, expect, it } from "vitest"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const coreSourceRoot = dirname(fileURLToPath(import.meta.url))
const modulesRoot = resolve(coreSourceRoot, "modules")

describe("core architecture", () => {
  it("src 직하위에는 core 구조 entrypoint만 둔다", () => {
    const allowedEntries = new Set([
      "architecture.test.ts",
      "composition",
      "modules",
      "shared",
    ])
    const violations = readdirSync(coreSourceRoot, { withFileTypes: true })
      .map((entry) => entry.name)
      .filter((entryName) => !allowedEntries.has(entryName))

    expect(violations).toEqual([])
  })

  it("module root에는 중복 public api facade를 두지 않는다", () => {
    const violations = readdirSync(modulesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const indexPath = resolve(modulesRoot, entry.name, "index.ts")
        return existsSync(indexPath)
          ? [formatViolation(indexPath, "index.ts")]
          : []
      })

    expect(violations).toEqual([])
  })

  it("module api facade는 infrastructure를 export하지 않는다", () => {
    const violations = readdirSync(modulesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const indexPath = resolve(modulesRoot, entry.name, "api", "index.ts")

        return readImports(indexPath)
          .filter((source) => source.includes("/infrastructure/"))
          .map((source) => formatViolation(indexPath, source))
      })

    expect(violations).toEqual([])
  })

  it("core 내부 구현은 module public api facade를 import하지 않는다", () => {
    const violations = readSourceFiles(coreSourceRoot)
      .filter((filePath) => !isFacadeFile(filePath))
      .flatMap((filePath) =>
        readImports(filePath)
          .filter(isModuleApiFacadeImport)
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("domain 계층은 runtime adapter 의존성을 import하지 않는다", () => {
    const violations = readSourceFiles(modulesRoot)
      .filter((filePath) => filePath.split(sep).includes("domain"))
      .flatMap((filePath) =>
        readImports(filePath)
          .filter(isRuntimeAdapterImport)
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("learning domain은 content module facade나 domain 파일을 직접 import하지 않는다", () => {
    const learningDomainRoot = resolve(modulesRoot, "learning", "domain")
    const violations = readSourceFiles(learningDomainRoot).flatMap((filePath) =>
      readImports(filePath)
        .filter(isCoreContentModuleImport)
        .map((source) => formatViolation(filePath, source))
    )

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

function isFacadeFile(filePath: string): boolean {
  return filePath.endsWith(`${sep}api${sep}index.ts`)
}

function isModuleApiFacadeImport(source: string): boolean {
  return /^#\/modules\/[^/]+\/api$/.test(source)
}

function isRuntimeAdapterImport(source: string): boolean {
  return (
    source === "@workspace/db" ||
    source.startsWith("@workspace/db/") ||
    source === "better-auth" ||
    source.startsWith("better-auth/") ||
    source === "drizzle-orm" ||
    source.startsWith("drizzle-orm/") ||
    source === "hono" ||
    source.startsWith("hono/") ||
    source === "openai" ||
    source.startsWith("openai/")
  )
}

function isCoreContentModuleImport(source: string): boolean {
  return (
    source === "#core/modules/content" ||
    source.startsWith("#core/modules/content/")
  )
}

function formatViolation(filePath: string, detail: string): string {
  return `${relative(coreSourceRoot, filePath)} -> ${detail}`
}
