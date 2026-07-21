import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

type PrivateImportScope = {
  readonly packageName?: string
  readonly root: string
}

const coreCapabilityFacades = [
  ["admin", "packages/core/src/modules/admin/api/index.ts"],
  ["ai-feedback", "packages/core/src/modules/ai-feedback/api/index.ts"],
  ["auth", "packages/core/src/modules/auth/api/index.ts"],
  ["content", "packages/core/src/modules/content/api/index.ts"],
  ["learning", "packages/core/src/modules/learning/api/index.ts"],
  [
    "resource-library",
    "packages/core/src/modules/resource-library/api/index.ts",
  ],
] as const

type CoreCapabilityName = (typeof coreCapabilityFacades)[number][0]
type CoreCapabilityPublicSurface = Readonly<
  Record<CoreCapabilityName, readonly string[]>
>

const repositoryRoot = process.cwd()
const coreCapabilityPublicSurfaceFixture =
  "scripts/fixtures/core-capability-public-surface.json"
const sourceExtensions = new Set([".ts", ".tsx", ".mdx"])
const failures: string[] = []
const privateImportScopes: readonly PrivateImportScope[] = [
  { packageName: "@workspace/auth", root: "packages/auth/src" },
  { packageName: "@workspace/core", root: "packages/core/src" },
  { packageName: "@workspace/ui", root: "packages/ui/src" },
  { packageName: "@workspace/env", root: "packages/env/src" },
  { root: "apps/storybook/src" },
  { root: "apps/storybook/.storybook" },
]

const expectedExports = {
  "packages/auth/package.json": [
    "./admin/client",
    "./admin/server",
    "./learner/client",
    "./learner/server",
    "./password",
    "./session-token",
    "./sqlite-database",
  ],
  "packages/contracts/package.json": [
    ".",
    "./admin",
    "./admin/*",
    "./admin/ai-chat-data",
    "./admin/content-data",
    "./admin/dashboard-analytics-data",
    "./admin/identity-data",
    "./admin/resource-library-data",
    "./admin/settings-data",
    "./ai-feedback",
    "./auth-session-cookie",
    "./brand",
    "./content",
    "./content/content.ids",
    "./content/steps",
    "./content/steps/*",
    "./learning",
    "./learning/api-error",
    "./learning/learner-api",
    "./learning/learner-content",
    "./learning/learner-read-model",
    "./learning/learner-transition",
    "./learning/learning",
    "./learning/learning.ids",
    "./learning/read-data",
    "./learning/step-data",
    "./status",
  ],
  "packages/core/package.json": [
    "./admin",
    "./ai-feedback",
    "./auth",
    "./content",
    "./learning",
    "./resource-library",
  ],
  "packages/env/package.json": ["./local-runtime-defaults", "./parse-env"],
  "packages/ui/package.json": [
    "./components/icons",
    "./components/lesson/*",
    "./components/lesson/lesson-step-checked-visual",
    "./components/ui/*",
    "./lib/*",
    "./pretendard-font",
    "./styles",
  ],
} as const
const forbiddenCoreFacadeReferences = {
  "packages/core/src/modules/admin/api/index.ts": [
    "/domain/admin.dto",
    "/ports/admin.repository",
    "/use-cases/admin.service",
  ],
  "packages/core/src/modules/auth/api/index.ts": ["/infrastructure/"],
} as const
const forbiddenAdminApplicationFacadeFiles = [
  "packages/core/src/modules/admin/application/policies/admin-actor-policy.ts",
  "packages/core/src/modules/admin/application/ports/admin.repository.ts",
  "packages/core/src/modules/admin/application/use-cases/admin.service.ts",
] as const
const forbiddenAdminApplicationFacadeSymbols = new Set([
  "AdminRepository",
  "AdminService",
  "AdminServicePorts",
  "createAdminService",
])
const forbiddenCoreForwardingFiles = [
  "packages/core/src/modules/admin/application/use-cases/admin-ai-chat.use-case.ts",
  "packages/core/src/modules/admin/application/use-cases/admin-analytics.use-case.ts",
  "packages/core/src/modules/admin/application/use-cases/admin-dashboard.use-case.ts",
  "packages/core/src/modules/admin/application/use-cases/admin-user.use-case.ts",
  "packages/core/src/modules/admin/domain/admin.dto.ts",
  "packages/core/src/modules/ai-feedback/domain/ai-feedback.dto.ts",
  "packages/core/src/modules/auth/application/use-cases/learner-onboarding.ts",
  "packages/core/src/modules/content/application/ports/content.repository.ts",
  "packages/core/src/modules/content/application/use-cases/content-reader.ts",
  "packages/core/src/modules/content/application/use-cases/learner-content.service.ts",
  "packages/core/src/modules/content/domain/content.dto.ts",
  "packages/core/src/modules/content/domain/content.ids.ts",
  "packages/core/src/modules/content/domain/steps/ai-feedback-step.dto.ts",
  "packages/core/src/modules/content/domain/steps/categorize-step.dto.ts",
  "packages/core/src/modules/content/domain/steps/compare-step.dto.ts",
  "packages/core/src/modules/content/domain/steps/fill-blank-step.dto.ts",
  "packages/core/src/modules/content/domain/steps/index.ts",
  "packages/core/src/modules/content/domain/steps/lesson-step-fields.ts",
  "packages/core/src/modules/content/domain/steps/match-step.dto.ts",
  "packages/core/src/modules/content/domain/steps/multiple-choice-step.dto.ts",
  "packages/core/src/modules/content/domain/steps/order-step.dto.ts",
  "packages/core/src/modules/content/domain/steps/reading-step.dto.ts",
  "packages/core/src/modules/content/domain/steps/select-step.dto.ts",
  "packages/core/src/modules/content/domain/steps/write-step.dto.ts",
  "packages/core/src/modules/learning/domain/learner-read-model.dto.ts",
  "packages/core/src/modules/learning/domain/learning.ids.ts",
  "packages/core/src/modules/learning/application/use-cases/learner-transition.service.ts",
  "packages/core/src/shared/kernel/status.ts",
] as const
const forbiddenUiPolicyFiles = [
  "packages/ui/src/components/lesson/match-presentation.ts",
  "packages/ui/src/lib/lesson-draft-storage.ts",
] as const

for (const forwardingFile of forbiddenCoreForwardingFiles) {
  if (fs.existsSync(path.join(repositoryRoot, forwardingFile))) {
    failures.push(`${forwardingFile} -> 제거된 forwarding 파일 재도입`)
  }
}

for (const facadeFile of forbiddenAdminApplicationFacadeFiles) {
  if (fs.existsSync(path.join(repositoryRoot, facadeFile))) {
    failures.push(`${facadeFile} -> 제거된 admin application façade 재도입`)
  }
}

for (const filePath of collectSourceFiles(
  path.join(repositoryRoot, "packages/core/src/modules/admin/application")
)) {
  for (const symbol of readTopLevelDeclarationNames(filePath)) {
    if (forbiddenAdminApplicationFacadeSymbols.has(symbol)) {
      failures.push(
        `${relativePath(filePath)} -> 제거된 admin application façade symbol ${symbol}`
      )
    }
  }
}

for (const policyFile of forbiddenUiPolicyFiles) {
  if (fs.existsSync(path.join(repositoryRoot, policyFile))) {
    failures.push(`${policyFile} -> UI에 앱 전용 정책 파일 재도입`)
  }
}

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

try {
  verifyCoreCapabilityPublicSurface()
} catch (error) {
  failures.push(
    `packages/core 공개 symbol snapshot 검사 실패: ${readErrorMessage(error)}`
  )
}

for (const [facadePath, forbiddenReferences] of Object.entries(
  forbiddenCoreFacadeReferences
)) {
  for (const source of readImports(path.join(repositoryRoot, facadePath))) {
    if (forbiddenReferences.some((reference) => source.includes(reference))) {
      failures.push(`${facadePath} -> 공개 금지 구현 ${source}`)
    }
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
      (source.startsWith("#core/") && source.includes(".repository"))
    ) {
      failures.push(`${relative} -> 허용되지 않은 core Interface ${source}`)
    }

    if (
      source === "@workspace/auth" ||
      source === "@workspace/ui" ||
      source === "@workspace/env"
    ) {
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
        ".worktrees",
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

function readTopLevelDeclarationNames(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf8")
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )

  return sourceFile.statements.flatMap((statement) => {
    if (
      ts.isClassDeclaration(statement) ||
      ts.isEnumDeclaration(statement) ||
      ts.isFunctionDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement)
    ) {
      return statement.name === undefined ? [] : [statement.name.text]
    }

    if (!ts.isVariableStatement(statement)) return []

    return statement.declarationList.declarations.flatMap((declaration) =>
      ts.isIdentifier(declaration.name) ? [declaration.name.text] : []
    )
  })
}

function verifyCoreCapabilityPublicSurface(): void {
  const expected = readCoreCapabilityPublicSurfaceFixture()
  const actual = readCoreCapabilityPublicSurface()

  for (const [capability, facadePath] of coreCapabilityFacades) {
    const expectedSymbols = expected[capability]
    const actualSymbols = actual[capability]
    const expectedSymbolSet = new Set(expectedSymbols)
    const actualSymbolSet = new Set(actualSymbols)
    const added = actualSymbols.filter(
      (symbol) => !expectedSymbolSet.has(symbol)
    )
    const removed = expectedSymbols.filter(
      (symbol) => !actualSymbolSet.has(symbol)
    )

    if (added.length === 0 && removed.length === 0) continue

    failures.push(
      `${facadePath} 공개 symbol snapshot 불일치: added=[${added.join(", ")}], removed=[${removed.join(", ")}]`
    )
  }
}

function readCoreCapabilityPublicSurfaceFixture(): CoreCapabilityPublicSurface {
  const fixturePath = path.join(
    repositoryRoot,
    coreCapabilityPublicSurfaceFixture
  )
  const parsed: unknown = JSON.parse(fs.readFileSync(fixturePath, "utf8"))

  if (!isUnknownObject(parsed)) {
    throw new Error(`${coreCapabilityPublicSurfaceFixture}는 object여야 함`)
  }

  const expectedCapabilityNames = coreCapabilityFacades
    .map(([capability]) => capability)
    .toSorted()
  const actualCapabilityNames = Object.keys(parsed).toSorted()

  if (
    JSON.stringify(actualCapabilityNames) !==
    JSON.stringify(expectedCapabilityNames)
  ) {
    throw new Error(
      `${coreCapabilityPublicSurfaceFixture} capability key 불일치: ${actualCapabilityNames.join(", ")}`
    )
  }

  return Object.fromEntries(
    coreCapabilityFacades.map(([capability]) => {
      const symbols = parsed[capability]

      if (
        !Array.isArray(symbols) ||
        !symbols.every((symbol) => typeof symbol === "string")
      ) {
        throw new Error(
          `${coreCapabilityPublicSurfaceFixture}의 ${capability}는 string 배열이어야 함`
        )
      }

      const normalizedSymbols = [...new Set(symbols)].toSorted()

      if (JSON.stringify(symbols) !== JSON.stringify(normalizedSymbols)) {
        throw new Error(
          `${coreCapabilityPublicSurfaceFixture}의 ${capability} symbol은 정렬되고 중복이 없어야 함`
        )
      }

      return [capability, symbols] as const
    })
  ) as CoreCapabilityPublicSurface
}

function readCoreCapabilityPublicSurface(): CoreCapabilityPublicSurface {
  const configPath = path.join(repositoryRoot, "packages/core/tsconfig.json")
  const config = ts.readConfigFile(configPath, ts.sys.readFile)

  if (config.error !== undefined) {
    throw new Error(readTypeScriptDiagnostic(config.error))
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    path.dirname(configPath),
    undefined,
    configPath
  )

  if (parsedConfig.errors.length > 0) {
    throw new Error(
      parsedConfig.errors.map(readTypeScriptDiagnostic).join("\n")
    )
  }

  const program = ts.createProgram({
    options: parsedConfig.options,
    projectReferences: parsedConfig.projectReferences,
    rootNames: parsedConfig.fileNames,
  })
  const checker = program.getTypeChecker()

  return Object.fromEntries(
    coreCapabilityFacades.map(([capability, facadePath]) => {
      const absoluteFacadePath = path.join(repositoryRoot, facadePath)
      const sourceFile = program.getSourceFile(absoluteFacadePath)

      if (sourceFile === undefined) {
        throw new Error(`${facadePath}를 TypeScript program에서 찾을 수 없음`)
      }

      const moduleSymbol = checker.getSymbolAtLocation(sourceFile)

      if (moduleSymbol === undefined) {
        throw new Error(`${facadePath}의 module symbol을 찾을 수 없음`)
      }

      const symbols = checker
        .getExportsOfModule(moduleSymbol)
        .map((symbol) => symbol.getName())
        .toSorted()

      return [capability, symbols] as const
    })
  ) as CoreCapabilityPublicSurface
}

function isUnknownObject(
  value: unknown
): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readTypeScriptDiagnostic(diagnostic: ts.Diagnostic): string {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
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
