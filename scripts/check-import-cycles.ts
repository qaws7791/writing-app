import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

type JsonRecord = Record<string, unknown>

type WorkspacePackage = {
  readonly dependencies: readonly string[]
  readonly directory: string
  readonly name: string
}

type ModuleCycleScope = {
  readonly aliases: readonly ModuleAlias[]
  readonly name: string
  readonly packageExports?: PackageExports
  readonly packageName?: string
  readonly packageRoot?: string
  readonly root: string
}

type ModuleAlias = {
  readonly prefix: string
  readonly root: string
}

type PackageExports = ReadonlyMap<string, readonly string[]>

const repositoryRoot = process.cwd()
const sourceExtensions = [".ts", ".tsx"] as const
const moduleCycleScopes: readonly ModuleCycleScope[] = [
  {
    aliases: [
      {
        prefix: "#core/",
        root: "packages/core/src",
      },
    ],
    name: "packages/core runtime modules",
    packageExports: readPackageExports("packages/core/package.json"),
    packageName: "@workspace/core",
    packageRoot: "packages/core",
    root: "packages/core/src",
  },
  {
    aliases: [
      {
        prefix: "@/",
        root: "apps/admin/src",
      },
    ],
    name: "apps/admin course editor runtime modules",
    root: "apps/admin/src/features/courses/course-editor",
  },
] as const

const failures: string[] = []

function readJsonFile(filePath: string): JsonRecord {
  const value: unknown = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, filePath), "utf8")
  )

  if (!isRecord(value)) {
    throw new Error(`${filePath} must contain a JSON object.`)
  }

  return value
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll(path.sep, "/")
}

function discoverWorkspacePackages(): WorkspacePackage[] {
  const rootPackageJson = readJsonFile("package.json")
  const workspaceGlobs = readStringArray(rootPackageJson["workspaces"])

  return workspaceGlobs.flatMap((workspaceGlob) => {
    if (!workspaceGlob.endsWith("/*")) {
      failures.push(`Unsupported workspace glob: ${workspaceGlob}`)
      return []
    }

    const rootDirectory = workspaceGlob.slice(0, -2)
    const absoluteRootDirectory = path.join(repositoryRoot, rootDirectory)

    if (!fs.existsSync(absoluteRootDirectory)) {
      failures.push(`Workspace root does not exist: ${rootDirectory}`)
      return []
    }

    return fs
      .readdirSync(absoluteRootDirectory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const directory = normalizePath(path.join(rootDirectory, entry.name))
        const manifestPath = path.join(directory, "package.json")

        if (!fs.existsSync(path.join(repositoryRoot, manifestPath))) {
          return []
        }

        const manifest = readJsonFile(manifestPath)
        const name = manifest["name"]
        const dependencies = isRecord(manifest["dependencies"])
          ? Object.keys(manifest["dependencies"])
          : []

        if (typeof name !== "string" || name.length === 0) {
          failures.push(`${manifestPath} must declare a package name.`)
          return []
        }

        return [
          {
            dependencies,
            directory,
            name,
          },
        ]
      })
  })
}

function validateWorkspacePackageCycles(
  workspacePackages: readonly WorkspacePackage[]
) {
  const packageNames = new Set(
    workspacePackages.map((workspacePackage) => workspacePackage.name)
  )
  const graph = new Map(
    workspacePackages.map((workspacePackage) => [
      workspacePackage.name,
      workspacePackage.dependencies.filter((dependency) =>
        packageNames.has(dependency)
      ),
    ])
  )

  for (const cycle of findCycles(graph)) {
    failures.push(
      `Workspace package runtime dependency cycle: ${cycle.join(" -> ")}`
    )
  }
}

function validateModuleCycles(scope: ModuleCycleScope) {
  const absoluteRoot = path.join(repositoryRoot, scope.root)
  const files = collectSourceFiles(absoluteRoot)
  const fileSet = new Set(files.map((filePath) => path.resolve(filePath)))
  const graph = new Map<string, string[]>()

  for (const filePath of files) {
    const imports = readRuntimeImports(filePath)
    const dependencies = imports
      .map((source) => resolveModuleSource(scope, filePath, source))
      .filter((resolvedPath): resolvedPath is string => resolvedPath !== null)
      .map((resolvedPath) => path.resolve(resolvedPath))
      .filter((resolvedPath) => fileSet.has(resolvedPath))

    graph.set(path.resolve(filePath), [...new Set(dependencies)].sort())
  }

  for (const cycle of findCycles(graph)) {
    failures.push(
      `${scope.name} runtime import cycle: ${cycle.map((filePath) => formatModulePath(scope, filePath)).join(" -> ")}`
    )
  }
}

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath)
    }

    if (!isRuntimeSourceFile(entry.name)) {
      return []
    }

    return [entryPath]
  })
}

function isRuntimeSourceFile(fileName: string): boolean {
  return (
    sourceExtensions.some((extension) => fileName.endsWith(extension)) &&
    !fileName.endsWith(".d.ts") &&
    !fileName.includes(".test.")
  )
}

function readRuntimeImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf8")
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
  const imports: string[] = []

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && isRuntimeImportDeclaration(node)) {
      pushImport(node.moduleSpecifier)
    }

    if (ts.isExportDeclaration(node) && !node.isTypeOnly) {
      pushImport(node.moduleSpecifier)
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      pushImport(node.arguments[0])
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

function isRuntimeImportDeclaration(node: ts.ImportDeclaration): boolean {
  const importClause = node.importClause

  if (importClause === undefined) {
    return true
  }

  if (importClause.isTypeOnly) {
    return false
  }

  if (importClause.name !== undefined) {
    return true
  }

  const namedBindings = importClause.namedBindings

  if (namedBindings === undefined || ts.isNamespaceImport(namedBindings)) {
    return namedBindings !== undefined
  }

  return namedBindings.elements.some((element) => !element.isTypeOnly)
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

function resolveModuleSource(
  scope: ModuleCycleScope,
  importerPath: string,
  source: string
): string | null {
  if (source.startsWith(".")) {
    return resolveFile(path.resolve(path.dirname(importerPath), source))
  }

  for (const alias of scope.aliases) {
    if (source.startsWith(alias.prefix)) {
      return resolveFile(
        path.join(repositoryRoot, alias.root, source.slice(alias.prefix.length))
      )
    }
  }

  if (
    scope.packageName !== undefined &&
    scope.packageRoot !== undefined &&
    scope.packageExports !== undefined &&
    (source === scope.packageName || source.startsWith(`${scope.packageName}/`))
  ) {
    return resolvePackageExport({
      packageExports: scope.packageExports,
      packageName: scope.packageName,
      packageRoot: path.join(repositoryRoot, scope.packageRoot),
      source,
    })
  }

  return null
}

function resolveFile(filePath: string): string | null {
  const candidates = [
    filePath,
    `${filePath}.ts`,
    `${filePath}.tsx`,
    path.join(filePath, "index.ts"),
    path.join(filePath, "index.tsx"),
  ]

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null
}

function readPackageExports(manifestPath: string): PackageExports {
  const manifest = readJsonFile(manifestPath)
  const exportsValue = manifest["exports"]

  if (!isRecord(exportsValue)) {
    return new Map()
  }

  return new Map(
    Object.entries(exportsValue).map(([exportKey, target]) => [
      exportKey,
      readExportTargets(target),
    ])
  )
}

function readExportTargets(value: unknown): string[] {
  if (typeof value === "string") {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap(readExportTargets)
  }

  if (isRecord(value)) {
    return Object.values(value).flatMap(readExportTargets)
  }

  return []
}

function resolvePackageExport({
  packageExports,
  packageName,
  packageRoot,
  source,
}: {
  readonly packageExports: PackageExports
  readonly packageName: string
  readonly packageRoot: string
  readonly source: string
}): string | null {
  const exportKey =
    source === packageName ? "." : `.${source.slice(packageName.length)}`
  const exactTargets = packageExports.get(exportKey)

  if (exactTargets !== undefined) {
    return resolveFirstPackageTarget(packageRoot, exactTargets)
  }

  for (const [candidate, targets] of packageExports) {
    if (!candidate.includes("*")) {
      continue
    }

    const [prefix = "", suffix = ""] = candidate.split("*")

    if (!exportKey.startsWith(prefix) || !exportKey.endsWith(suffix)) {
      continue
    }

    const wildcardValue = exportKey.slice(
      prefix.length,
      exportKey.length - suffix.length
    )
    const resolvedTargets = targets.map((target) =>
      target.replace("*", wildcardValue)
    )

    return resolveFirstPackageTarget(packageRoot, resolvedTargets)
  }

  return null
}

function resolveFirstPackageTarget(
  packageRoot: string,
  targets: readonly string[]
): string | null {
  for (const target of targets) {
    const resolvedTarget = resolveFile(path.join(packageRoot, target))

    if (resolvedTarget !== null) {
      return resolvedTarget
    }
  }

  return null
}

function findCycles(graph: ReadonlyMap<string, readonly string[]>): string[][] {
  const cycles = new Map<string, string[]>()
  const visited = new Set<string>()
  const visiting = new Set<string>()

  function visit(node: string, pathStack: readonly string[]) {
    if (visiting.has(node)) {
      const startIndex = pathStack.indexOf(node)

      if (startIndex >= 0) {
        const cycle = [...pathStack.slice(startIndex), node]
        cycles.set(normalizeCycleKey(cycle), cycle)
      }
      return
    }

    if (visited.has(node)) {
      return
    }

    visiting.add(node)

    for (const dependency of graph.get(node) ?? []) {
      visit(dependency, [...pathStack, node])
    }

    visiting.delete(node)
    visited.add(node)
  }

  for (const node of graph.keys()) {
    visit(node, [])
  }

  return [...cycles.values()]
}

function normalizeCycleKey(cycle: readonly string[]): string {
  const cycleWithoutRepeatedEnd = cycle.slice(0, -1)
  const rotations = cycleWithoutRepeatedEnd.map((_, index) => [
    ...cycleWithoutRepeatedEnd.slice(index),
    ...cycleWithoutRepeatedEnd.slice(0, index),
  ])
  const normalized = rotations
    .map((rotation) => rotation.join("\u0000"))
    .sort()[0]

  return normalized ?? cycle.join("\u0000")
}

function formatModulePath(scope: ModuleCycleScope, filePath: string): string {
  return normalizePath(
    path.relative(path.join(repositoryRoot, scope.root), filePath)
  )
}

const workspacePackages = discoverWorkspacePackages()

validateWorkspacePackageCycles(workspacePackages)

for (const scope of moduleCycleScopes) {
  validateModuleCycles(scope)
}

if (failures.length > 0) {
  console.error("Import cycle check failed.")

  for (const failure of failures) {
    console.error(`- ${failure}`)
  }

  process.exit(1)
}

console.log(
  `Import cycle check passed across ${workspacePackages.length} workspaces and ${moduleCycleScopes.length} module scopes.`
)
