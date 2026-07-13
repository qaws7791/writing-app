import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

type PrivateImportScope = {
  readonly packageName?: string
  readonly root: string
}

const repositoryRoot = process.cwd()
const sourceExtensions = new Set([".ts", ".tsx", ".mdx"])
const failures: string[] = []
const privateImportScopes: readonly PrivateImportScope[] = [
  { packageName: "@workspace/core", root: "packages/core/src" },
  { packageName: "@workspace/core", root: "packages/core/load" },
  { packageName: "@workspace/ui", root: "packages/ui/src" },
  { packageName: "@workspace/hono", root: "packages/hono/src" },
  { packageName: "@workspace/env", root: "packages/env/src" },
  { root: "apps/storybook/src" },
  { root: "apps/storybook/.storybook" },
]

const expectedExports = {
  "packages/core/package.json": [
    "./admin",
    "./admin-api-core",
    "./ai-feedback",
    "./auth",
    "./content",
    "./learner-api-core",
    "./learning",
    "./resource-library",
  ],
  "packages/env/package.json": ["./local-runtime-defaults", "./parse-env"],
  "packages/ui/package.json": [
    "./components/icons",
    "./components/lesson/*",
    "./components/lesson/lesson-step-checked-visual",
    "./components/lesson/match-presentation",
    "./components/ui/*",
    "./lesson-runtime/logic",
    "./lesson-runtime/policy",
    "./lesson-runtime/renderer",
    "./lesson-runtime/types",
    "./lib/*",
    "./pretendard-font",
    "./styles",
  ],
} as const

for (const [manifestPath, expected] of Object.entries(expectedExports)) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, manifestPath), "utf8")
  ) as { readonly exports?: Readonly<Record<string, unknown>> }
  const actual = Object.keys(manifest.exports ?? {}).sort()

  if (JSON.stringify(actual) !== JSON.stringify([...expected].sort())) {
    failures.push(
      `${manifestPath} 공개 export snapshot 불일치: ${actual.join(", ")}`
    )
  }
}

for (const scope of privateImportScopes) {
  for (const filePath of collectSourceFiles(
    path.join(repositoryRoot, scope.root)
  )) {
    for (const source of readImports(filePath)) {
      if (source.startsWith(".")) {
        failures.push(`${relativePath(filePath)} -> 상대 import ${source}`)
      }

      if (
        scope.packageName !== undefined &&
        (source === scope.packageName ||
          source.startsWith(`${scope.packageName}/`))
      ) {
        failures.push(
          `${relativePath(filePath)} -> 자기 공개 Interface ${source}`
        )
      }
    }
  }
}

for (const filePath of collectSourceFiles(repositoryRoot)) {
  if (filePath.includes(`${path.sep}node_modules${path.sep}`)) continue

  const relative = relativePath(filePath)
  if (relative.startsWith("packages/core/")) continue

  for (const source of readImports(filePath)) {
    if (
      source === "@workspace/core" ||
      source.startsWith("@workspace/core/modules/") ||
      source.startsWith("@workspace/core/shared/") ||
      source.includes(".repository")
    ) {
      failures.push(`${relative} -> 허용되지 않은 core Interface ${source}`)
    }

    if (source === "@workspace/ui" || source === "@workspace/env") {
      failures.push(`${relative} -> root barrel ${source}`)
    }
  }
}

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (
      [
        ".git",
        ".next",
        "dist",
        "node_modules",
        "legacy",
        "writing-app",
      ].includes(entry.name)
    )
      return []
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return collectSourceFiles(entryPath)
    return sourceExtensions.has(path.extname(entry.name)) ? [entryPath] : []
  })
}

function readImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf8")
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
  const imports: string[] = []
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const source = node.moduleSpecifier
      if (source !== undefined && ts.isStringLiteralLike(source))
        imports.push(source.text)
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const source = node.arguments[0]
      if (source !== undefined && ts.isStringLiteralLike(source))
        imports.push(source.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return imports
}

function relativePath(filePath: string): string {
  return path.relative(repositoryRoot, filePath).replaceAll(path.sep, "/")
}

if (failures.length > 0) {
  console.error("Package Interface check failed.")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Package Interface and private import check passed.")
