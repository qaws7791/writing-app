import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

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

  it("course editor step form registry는 step-forms barrel만 import한다", () => {
    const registryPath = resolve(
      courseEditorSourceRoot,
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
})

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

function isAdminApiBoundaryFile(filePath: string): boolean {
  return (
    relative(adminSourceRoot, filePath).split(sep).join("/") ===
    "lib/api/http-admin-api.ts"
  )
}

function isCourseEditorStepFormsDeepImport(source: string): boolean {
  return source.startsWith("@/features/courses/course-editor/step-forms/")
}

function isCourseEditorStepFormRegistryImport(source: string): boolean {
  return source === "@/features/courses/course-editor/step-form-registry"
}

function formatViolation(filePath: string, source: string): string {
  return `${relative(adminSourceRoot, filePath).split(sep).join("/")} -> ${source}`
}
