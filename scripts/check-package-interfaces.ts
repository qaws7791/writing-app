import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

const repositoryRoot = process.cwd()
const sourceExtensions = new Set([".ts", ".tsx", ".mdx"])
const failures: string[] = []
const storybookImportRoots = [
  "apps/storybook/src",
  "apps/storybook/.storybook",
] as const

const forbiddenSharedUiIoPattern =
  /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(|["']use server["']/u
const processEnvironmentPattern = /\bprocess\s*\.\s*env\b/u
const canonicalIdNames = new Set([
  "AdminId",
  "AiChangeProposalId",
  "ConversationId",
  "CourseId",
  "CurriculumVersionId",
  "LearnerId",
  "LessonId",
  "LessonStepId",
  "LessonStepItemId",
  "MessageId",
  "ResourceAssetId",
  "ResourceDocumentId",
  "ResourceFolderId",
  "ResourceNodeId",
  "UnitId",
  "UserId",
])
const canonicalSchemaConsumers = [
  [
    "packages/infra/http-platform/src/errors/error-response.ts",
    "@workspace/contracts/operations/admin-api-error",
  ],
  [
    "apps/admin/src/shared/http/admin-api-error.ts",
    "@workspace/contracts/operations/admin-api-error",
  ],
  [
    "apps/api/src/http/learner-error-response.ts",
    "@workspace/contracts/learning/api-error",
  ],
  [
    "apps/web/src/shared/http/api-error.ts",
    "@workspace/contracts/learning/api-error",
  ],
] as const

for (const filePath of collectSourceFiles(
  path.join(repositoryRoot, "packages/shared/kernel/src")
)) {
  const source = fs.readFileSync(filePath, "utf8")
  if (/\bprocess\s*\.\s*env\b/u.test(source)) {
    failures.push(`${relativePath(filePath)} -> kernel의 process.env 접근 금지`)
  }
}

for (const filePath of collectSourceFiles(
  path.join(repositoryRoot, "packages/shared/ui/src")
)) {
  const source = fs.readFileSync(filePath, "utf8")
  if (forbiddenSharedUiIoPattern.test(source)) {
    failures.push(
      `${relativePath(filePath)} -> UI의 직접 I/O·server command 금지`
    )
  }
}

for (const [consumerPath, canonicalContract] of canonicalSchemaConsumers) {
  const imports = readImports(path.join(repositoryRoot, consumerPath))
  if (!imports.includes(canonicalContract)) {
    failures.push(
      `${consumerPath} -> canonical schema ${canonicalContract}를 직접 소비해야 함`
    )
  }
}

verifyP3InfrastructureOwnership()
verifyP10ApiCompositionOwnership()
verifyP11SchemaOwnership()
verifyP12FrontendOwnership()
verifyP13RuntimeSafety()

const sharedUiManifestPath = path.join(
  repositoryRoot,
  "packages/shared/ui/package.json"
)
const sharedUiManifest = JSON.parse(
  fs.readFileSync(sharedUiManifestPath, "utf8")
) as { readonly exports?: Readonly<Record<string, unknown>> }
const sharedUiExportKeys = Object.keys(sharedUiManifest.exports ?? {})
const allowedSharedUiExportPattern =
  /^\.\/(?:components\/(?:icons|lesson\/[a-z0-9-]+|ui\/[a-z0-9-]+)|lib\/[a-z0-9-]+|pretendard-font|styles)$/u

for (const exportKey of sharedUiExportKeys) {
  if (!allowedSharedUiExportPattern.test(exportKey)) {
    failures.push(
      `packages/shared/ui/package.json -> 분류되지 않은 UI export ${exportKey}`
    )
  }
}
for (const importRoot of storybookImportRoots) {
  for (const filePath of collectSourceFiles(
    path.join(repositoryRoot, importRoot)
  )) {
    for (const source of readImports(filePath)) {
      if (source.startsWith(".")) {
        failures.push(`${relativePath(filePath)} -> 상대 import ${source}`)
      }
    }
  }
}

for (const filePath of collectSourceFiles(repositoryRoot)) {
  if (filePath.includes(`${path.sep}node_modules${path.sep}`)) continue

  const relative = relativePath(filePath)
  if (relative !== "packages/shared/types/src/ids.ts") {
    for (const symbol of readTopLevelDeclarationNames(filePath)) {
      if (canonicalIdNames.has(symbol)) {
        failures.push(`${relative} -> canonical ID ${symbol}의 중복 선언 금지`)
      }
    }
  }
  if (relative.endsWith("/next-env.d.ts")) continue

  for (const source of readImports(filePath)) {
    if (/\.(?:[cm]?[jt]sx?)$/u.test(source)) {
      failures.push(`${relative} -> extension이 붙은 import ${source}`)
    }
  }
}

verifyTargetPackageInterfaces()

function verifyTargetPackageInterfaces(): void {
  for (const group of ["config", "infra", "modules", "shared"] as const) {
    const groupRoot = path.join(repositoryRoot, "packages", group)
    if (!fs.existsSync(groupRoot)) continue

    for (const entry of fs.readdirSync(groupRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const manifestPath = path.join(groupRoot, entry.name, "package.json")
      if (!fs.existsSync(manifestPath)) continue

      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
        readonly name?: string
      }
      if (typeof manifest.name === "string") {
        const sourceRoot = path.join(path.dirname(manifestPath), "src")
        if (!fs.existsSync(sourceRoot)) continue
        for (const filePath of collectSourceFiles(sourceRoot)) {
          for (const source of readImports(filePath)) {
            if (source.startsWith(".")) {
              failures.push(
                `${relativePath(filePath)} -> 상대 import ${source}`
              )
            }
            if (
              source === manifest.name ||
              source.startsWith(`${manifest.name}/`)
            ) {
              failures.push(
                `${relativePath(filePath)} -> 자기 공개 Interface ${source}`
              )
            }
          }
        }
      }
    }
  }
}

function verifyP3InfrastructureOwnership(): void {
  const infraRoot = path.join(repositoryRoot, "packages/infra")

  for (const filePath of collectSourceFiles(infraRoot)) {
    const relative = relativePath(filePath)
    const source = fs.readFileSync(filePath, "utf8")
    if (/\bprocess\s*\.\s*env\b/u.test(source)) {
      failures.push(`${relative} -> infra package의 process.env 접근 금지`)
    }
  }

  const aiRoot = path.join(repositoryRoot, "packages/infra/ai/src")
  for (const filePath of collectSourceFiles(aiRoot)) {
    const relative = relativePath(filePath)
    for (const imported of readImports(filePath)) {
      if (imported.startsWith("@workspace/contracts/")) {
        failures.push(
          `${relative} -> AI infra의 제품 contract import ${imported}`
        )
      }
    }
  }

  const storageRoot = path.join(repositoryRoot, "packages/infra/storage/src")
  for (const filePath of collectSourceFiles(storageRoot)) {
    const relative = relativePath(filePath)
    const source = fs.readFileSync(filePath, "utf8")
    if (/image\/(?:jpeg|png|webp)|resource-library\//u.test(source)) {
      failures.push(
        `${relative} -> storage infra의 제품 MIME·object key policy 금지`
      )
    }
  }
}

function verifyP10ApiCompositionOwnership(): void {
  const apiSourceRoot = path.join(repositoryRoot, "apps/api/src")
  for (const filePath of collectSourceFiles(apiSourceRoot)) {
    const relative = relativePath(filePath)
    if (
      relative.includes(".test.") ||
      relative.includes("/scripts/") ||
      relative.includes("/test-support/") ||
      relative.includes("/runtime/")
    ) {
      continue
    }

    const source = fs.readFileSync(filePath, "utf8")
    if (/\b(?:crypto\.randomUUID|Date\.now|new Date\(\s*\))/u.test(source)) {
      failures.push(
        `${relative} -> Clock·UUID production adapter는 apps/api runtime만 소유해야 함`
      )
    }
    if (
      relative !== "apps/api/src/main.ts" &&
      /\b(?:Bun\.env|process\.env)\b/u.test(source)
    ) {
      failures.push(
        `${relative} -> 검증 전 원문 env는 API main 경계를 넘을 수 없음`
      )
    }
  }
}

function verifyP11SchemaOwnership(): void {
  const applicationSchemaPath = "apps/api/src/db/schema.ts"
  const modulePackages = [
    "ai-feedback",
    "content",
    "identity",
    "learning",
    "operations",
    "resource-library",
  ] as const
  const schemaImports = [
    "@workspace/auth/schema",
    ...modulePackages.map((packageName) => `@workspace/${packageName}/schema`),
  ]
  const actualSchemaImports = readImports(
    path.join(repositoryRoot, applicationSchemaPath)
  ).sort()

  if (
    JSON.stringify(actualSchemaImports) !==
    JSON.stringify([...schemaImports].sort())
  ) {
    failures.push(
      `${applicationSchemaPath} -> auth와 여섯 module schema의 명시적 합성 필요`
    )
  }

  for (const filePath of collectSourceFiles(repositoryRoot)) {
    if (filePath.includes(`${path.sep}node_modules${path.sep}`)) continue
    const relative = relativePath(filePath)

    for (const imported of readImports(filePath)) {
      if (
        imported === "@workspace/db/test-support/application-migration" &&
        !relative.endsWith(".test.ts") &&
        !relative.includes("/test-support/")
      ) {
        failures.push(
          `${relative} -> baseline test helper의 runtime import 금지`
        )
      }
    }
  }

  const drizzleConfigPath = "apps/api/drizzle.config.ts"
  const drizzleConfig = readOptionalSource(drizzleConfigPath)
  if (
    !drizzleConfig.includes('schema: "./src/db/schema.ts"') ||
    !drizzleConfig.includes('out: "./drizzle"')
  ) {
    failures.push(
      `${drizzleConfigPath} -> application schema와 migration directory만 사용해야 함`
    )
  }

  const dbManifest = JSON.parse(
    fs.readFileSync(
      path.join(repositoryRoot, "packages/infra/db/package.json"),
      "utf8"
    )
  ) as {
    readonly exports?: Readonly<Record<string, unknown>>
  }
  if (dbManifest.exports?.["./schema"] !== undefined) {
    failures.push("packages/infra/db/package.json -> schema 재공개 금지")
  }
}

function verifyP12FrontendOwnership(): void {
  for (const appName of ["admin", "web"] as const) {
    const appRoot = path.join(repositoryRoot, `apps/${appName}/src`)
    const serverFiles = [
      ...collectSourceFiles(path.join(appRoot, "server")),
      ...fs
        .readdirSync(path.join(appRoot, "features"), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .flatMap((entry) => {
          const serverDirectory = path.join(
            appRoot,
            "features",
            entry.name,
            "server"
          )
          return fs.existsSync(serverDirectory)
            ? collectSourceFiles(serverDirectory)
            : []
        }),
    ]

    for (const filePath of serverFiles) {
      if (/\.(?:test|spec)\.[jt]sx?$/u.test(filePath)) continue
      if (!readImports(filePath).includes("server-only")) {
        failures.push(
          `${relativePath(filePath)} -> frontend server 경계의 server-only marker 누락`
        )
      }
    }
  }
}

function verifyP13RuntimeSafety(): void {
  const rateLimitOwners = [
    {
      root: "packages/infra/auth/src",
      tables: ["admin_auth_rate_limit", "auth_rate_limit"],
    },
    {
      root: "packages/modules/ai-feedback/src",
      tables: ["ai_feedback_attempts"],
    },
    {
      root: "packages/modules/operations/src",
      tables: ["operations_ai_quota_counters"],
    },
  ] as const

  for (const owner of rateLimitOwners) {
    const ownerSources = collectSourceFiles(
      path.join(repositoryRoot, owner.root)
    )
      .filter(
        (filePath) => !/\.(?:spec|test|typecheck)\.[jt]sx?$/u.test(filePath)
      )
      .map((filePath) => fs.readFileSync(filePath, "utf8"))
      .join("\n")

    for (const table of owner.tables) {
      const tableNamePattern = new RegExp(`\\b${table}\\b`, "u")
      if (!tableNamePattern.test(ownerSources)) {
        failures.push(`${owner.root} -> rate-limit owner table ${table} 누락`)
      }
    }
    for (const foreignOwner of rateLimitOwners) {
      if (foreignOwner.root === owner.root) continue
      for (const foreignTable of foreignOwner.tables) {
        const foreignTableNamePattern = new RegExp(`\\b${foreignTable}\\b`, "u")
        if (foreignTableNamePattern.test(ownerSources)) {
          failures.push(
            `${owner.root} -> 다른 rate-limit owner table ${foreignTable} 접근 금지`
          )
        }
      }
    }
  }

  const moduleRoot = path.join(repositoryRoot, "packages/modules")
  for (const moduleEntry of fs.readdirSync(moduleRoot, {
    withFileTypes: true,
  })) {
    if (!moduleEntry.isDirectory()) continue

    for (const layer of ["application", "domain"] as const) {
      const layerRoot = path.join(moduleRoot, moduleEntry.name, "src", layer)
      if (!fs.existsSync(layerRoot)) continue

      for (const filePath of collectSourceFiles(layerRoot)) {
        if (/\.(?:test|typecheck)\.[jt]sx?$/u.test(filePath)) continue
        const relative = relativePath(filePath)
        const source = fs.readFileSync(filePath, "utf8")

        if (processEnvironmentPattern.test(source)) {
          failures.push(
            `${relative} -> domain·application의 process.env 접근 금지`
          )
        }
        if (
          /\b(?:Date\.now\s*\(|Math\.random\s*\(|crypto\.randomUUID\s*\(|randomUUID\s*\(|new\s+Date\s*\(\s*\))/u.test(
            source
          )
        ) {
          failures.push(
            `${relative} -> domain·application의 직접 시간·ID 생성 금지`
          )
        }
        if (/\bResult(?:Async)?\s*<\s*boolean\b/u.test(source)) {
          failures.push(
            `${relative} -> expected outcome은 boolean 대신 판별 가능한 variant 필요`
          )
        }
        if (
          layer === "domain" &&
          /JSON\.stringify\s*\([^)]*\)\s*(?:===|!==)|(?:===|!==)\s*JSON\.stringify\s*\(/u.test(
            source
          )
        ) {
          failures.push(
            `${relative} -> domain value equality의 JSON.stringify 사용 금지`
          )
        }
      }
    }
  }

  verifyModuleEnvironmentAccessFixture()

  const externalIoImports = [
    "@aws-sdk/client-s3",
    "@mastra/",
    "@workspace/ai",
    "@workspace/storage",
    "openai",
  ] as const
  const telemetryImports = ["@opentelemetry/", "@sentry/"] as const

  for (const filePath of collectSourceFiles(repositoryRoot)) {
    if (filePath.includes(`${path.sep}node_modules${path.sep}`)) continue
    const relative = relativePath(filePath)
    if (!/^(?:apps|packages)\//u.test(relative)) continue
    if (/\.(?:spec|test|typecheck)\.[jt]sx?$/u.test(relative)) continue

    const source = fs.readFileSync(filePath, "utf8")
    const imports = readImports(filePath)
    if (
      /["'](?:cf-connecting-ip|x-forwarded-for|x-real-ip)["']/iu.test(source)
    ) {
      failures.push(
        `${relative} -> 정제되지 않은 client IP 전달 header 직접 신뢰 금지`
      )
    }
    if (
      /\.transaction\s*\(/u.test(source) &&
      imports.some((imported) =>
        externalIoImports.some(
          (external) => imported === external || imported.startsWith(external)
        )
      )
    ) {
      failures.push(
        `${relative} -> database transaction 내부 외부 provider 의존 금지`
      )
    }
    for (const imported of imports) {
      if (
        telemetryImports.some(
          (telemetry) =>
            imported === telemetry || imported.startsWith(telemetry)
        )
      ) {
        failures.push(
          `${relative} -> 운영 결정 없는 telemetry backend 도입 금지: ${imported}`
        )
      }
    }
  }
}

function verifyModuleEnvironmentAccessFixture(): void {
  const fixturePath = path.join(
    repositoryRoot,
    "scripts/fixtures/p15-module-environment-access.txt"
  )
  const fixture = fs.readFileSync(fixturePath, "utf8")
  if (!processEnvironmentPattern.test(fixture)) {
    failures.push(
      `${relativePath(fixturePath)} -> module process.env 금지 fixture 회귀`
    )
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
        "Kwep",
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

function readOptionalSource(relative: string): string {
  const filePath = path.join(repositoryRoot, relative)
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : ""
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

function relativePath(filePath: string): string {
  return path.relative(repositoryRoot, filePath).replaceAll(path.sep, "/")
}

if (failures.length > 0) {
  console.error("Package Interface check failed.")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Package Interface and private import check passed.")
