import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

export type ModuleReference = {
  readonly importedNames: readonly string[]
  readonly kind: "dynamic" | "export" | "import" | "import-type"
  readonly runtime: boolean
  readonly source: string
}

export type RepositoryFile = {
  readonly path: string
  readonly references: readonly ModuleReference[]
  readonly relativePath: string
}

export type ModuleAlias = {
  readonly prefix: string
  readonly root: string
}

export type PackageModule = {
  readonly exports: Readonly<Record<string, string | readonly string[]>>
  readonly name: string
  readonly root: string
}

export type ModuleCycle = {
  readonly chain: readonly string[]
}

export function createRepositoryInventory({
  includeTests = true,
  root,
}: {
  readonly includeTests?: boolean
  readonly root: string
}): RepositoryFile[] {
  const absoluteRoot = path.resolve(root)

  return collectSourceFiles(absoluteRoot, includeTests)
    .sort()
    .map((filePath) => ({
      path: filePath,
      references: readModuleReferences(filePath),
      relativePath: formatPath(path.relative(absoluteRoot, filePath)),
    }))
}

export function readModuleReferences(filePath: string): ModuleReference[] {
  const content = fs.readFileSync(filePath, "utf8")
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
  const references: ModuleReference[] = []

  function visit(node: ts.Node): void {
    if (ts.isImportDeclaration(node)) {
      const source = readStringLiteral(node.moduleSpecifier)
      if (source !== null) {
        references.push({
          importedNames: readImportedNames(node.importClause),
          kind: "import",
          runtime: isRuntimeImport(node),
          source,
        })
      }
    }

    if (ts.isExportDeclaration(node)) {
      const source = readStringLiteral(node.moduleSpecifier)
      if (source !== null) {
        references.push({
          importedNames: readExportedNames(node),
          kind: "export",
          runtime: node.isTypeOnly !== true,
          source,
        })
      }
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const source = readStringLiteral(node.arguments[0])
      if (source !== null) {
        references.push({
          importedNames: [],
          kind: "dynamic",
          runtime: true,
          source,
        })
      }
    }

    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      const source = readStringLiteral(node.argument.literal)
      if (source !== null) {
        references.push({
          importedNames: [],
          kind: "import-type",
          runtime: false,
          source,
        })
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return references
}

export function collectImportViolations({
  files,
  matches,
}: {
  readonly files: readonly RepositoryFile[]
  readonly matches: (input: {
    readonly file: RepositoryFile
    readonly reference: ModuleReference
  }) => boolean
}): string[] {
  return files.flatMap((file) =>
    file.references
      .filter((reference) => matches({ file, reference }))
      .map(
        (reference) =>
          `${file.relativePath} -> ${reference.source}${
            reference.importedNames.length > 0
              ? `:${reference.importedNames.join(",")}`
              : ""
          }`
      )
  )
}

export function createModuleGraph({
  aliases = [],
  packages = [],
  root,
}: {
  readonly aliases?: readonly ModuleAlias[]
  readonly packages?: readonly PackageModule[]
  readonly root: string
}): ReadonlyMap<string, readonly string[]> {
  const files = createRepositoryInventory({ includeTests: false, root })
  const fileSet = new Set(files.map((file) => path.resolve(file.path)))

  return new Map(
    files.map((file) => {
      const dependencies = file.references
        .filter((reference) => reference.runtime)
        .map((reference) =>
          resolveModuleReference({
            aliases,
            importerPath: file.path,
            packages,
            source: reference.source,
          })
        )
        .filter((dependency): dependency is string => dependency !== null)
        .map((dependency) => path.resolve(dependency))
        .filter((dependency) => fileSet.has(dependency))

      return [
        path.resolve(file.path),
        [...new Set(dependencies)].sort(),
      ] as const
    })
  )
}

export function findCycles(
  graph: ReadonlyMap<string, readonly string[]>
): ModuleCycle[] {
  const cycles = new Map<string, readonly string[]>()
  const visited = new Set<string>()
  const visiting = new Set<string>()

  function visit(node: string, stack: readonly string[]): void {
    if (visiting.has(node)) {
      const start = stack.indexOf(node)
      if (start >= 0) {
        const chain = [...stack.slice(start), node]
        cycles.set(normalizeCycle(chain), chain)
      }
      return
    }
    if (visited.has(node)) return

    visiting.add(node)
    for (const dependency of graph.get(node) ?? []) {
      visit(dependency, [...stack, node])
    }
    visiting.delete(node)
    visited.add(node)
  }

  for (const node of graph.keys()) visit(node, [])
  return [...cycles.values()].map((chain) => ({ chain }))
}

export function formatPath(filePath: string): string {
  return filePath.replaceAll(path.sep, "/")
}

function collectSourceFiles(root: string, includeTests: boolean): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name)
    if (entry.isDirectory()) return collectSourceFiles(entryPath, includeTests)
    if (!/\.tsx?$/u.test(entry.name) || entry.name.endsWith(".d.ts")) return []
    if (!includeTests && entry.name.includes(".test.")) return []
    return [entryPath]
  })
}

function readImportedNames(clause: ts.ImportClause | undefined): string[] {
  if (clause === undefined) return []
  const names = clause.name === undefined ? [] : [clause.name.text]
  if (clause.namedBindings === undefined) return names
  if (ts.isNamespaceImport(clause.namedBindings)) {
    return [...names, clause.namedBindings.name.text]
  }
  return [
    ...names,
    ...clause.namedBindings.elements.map(
      (specifier) => specifier.propertyName?.text ?? specifier.name.text
    ),
  ]
}

function readExportedNames(node: ts.ExportDeclaration): string[] {
  return node.exportClause !== undefined && ts.isNamedExports(node.exportClause)
    ? node.exportClause.elements.map(
        (specifier) => specifier.propertyName?.text ?? specifier.name.text
      )
    : []
}

function isRuntimeImport(node: ts.ImportDeclaration): boolean {
  const clause = node.importClause
  if (clause === undefined) return true
  if (clause.isTypeOnly) return false
  if (clause.name !== undefined) return true
  if (clause.namedBindings === undefined) return false
  if (ts.isNamespaceImport(clause.namedBindings)) return true
  return clause.namedBindings.elements.some(
    (specifier) => !specifier.isTypeOnly
  )
}

function readStringLiteral(node: ts.Node | undefined): string | null {
  return node !== undefined &&
    (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : null
}

function resolveModuleReference({
  aliases,
  importerPath,
  packages,
  source,
}: {
  readonly aliases: readonly ModuleAlias[]
  readonly importerPath: string
  readonly packages: readonly PackageModule[]
  readonly source: string
}): string | null {
  if (source.startsWith(".")) {
    return resolveFile(path.resolve(path.dirname(importerPath), source))
  }

  const alias = aliases.find((candidate) => source.startsWith(candidate.prefix))
  if (alias !== undefined) {
    return resolveFile(
      path.resolve(alias.root, source.slice(alias.prefix.length))
    )
  }

  const packageModule = packages.find(
    (candidate) =>
      source === candidate.name || source.startsWith(`${candidate.name}/`)
  )
  if (packageModule === undefined) return null

  const exportKey =
    source === packageModule.name
      ? "."
      : `.${source.slice(packageModule.name.length)}`
  return resolvePackageExport(packageModule, exportKey)
}

function resolvePackageExport(
  packageModule: PackageModule,
  exportKey: string
): string | null {
  for (const [candidate, targetValue] of Object.entries(
    packageModule.exports
  )) {
    const wildcard = matchWildcard(candidate, exportKey)
    if (candidate !== exportKey && wildcard === null) continue
    const targets = Array.isArray(targetValue) ? targetValue : [targetValue]
    for (const target of targets) {
      const resolved = resolveFile(
        path.resolve(packageModule.root, target.replace("*", wildcard ?? ""))
      )
      if (resolved !== null) return resolved
    }
  }
  return null
}

function matchWildcard(pattern: string, value: string): string | null {
  const marker = pattern.indexOf("*")
  if (marker < 0) return null
  const prefix = pattern.slice(0, marker)
  const suffix = pattern.slice(marker + 1)
  return value.startsWith(prefix) && value.endsWith(suffix)
    ? value.slice(prefix.length, value.length - suffix.length)
    : null
}

function resolveFile(candidate: string): string | null {
  const candidates = [
    candidate,
    `${candidate}.ts`,
    `${candidate}.tsx`,
    path.join(candidate, "index.ts"),
    path.join(candidate, "index.tsx"),
  ]
  return candidates.find((filePath) => fs.existsSync(filePath)) ?? null
}

function normalizeCycle(chain: readonly string[]): string {
  const nodes = chain.slice(0, -1)
  return (
    nodes
      .map((_, index) => [...nodes.slice(index), ...nodes.slice(0, index)])
      .map((rotation) => rotation.join("\u0000"))
      .sort()[0] ?? chain.join("\u0000")
  )
}
