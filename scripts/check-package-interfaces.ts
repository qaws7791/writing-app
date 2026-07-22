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
  { packageName: "@workspace/auth", root: "packages/infra/auth/src" },
  { packageName: "@workspace/core", root: "packages/core/src" },
  {
    packageName: "@workspace/contracts",
    root: "packages/shared/contracts/src",
  },
  { packageName: "@workspace/errors", root: "packages/shared/errors/src" },
  {
    packageName: "@workspace/event-contracts",
    root: "packages/shared/event-contracts/src",
  },
  { packageName: "@workspace/kernel", root: "packages/shared/kernel/src" },
  {
    packageName: "@workspace/resource-document",
    root: "packages/shared/resource-document/src",
  },
  { packageName: "@workspace/types", root: "packages/shared/types/src" },
  { packageName: "@workspace/ui", root: "packages/shared/ui/src" },
  { packageName: "@workspace/env", root: "packages/config/env/src" },
  {
    packageName: "@workspace/nextjs-config",
    root: "packages/config/nextjs-config/src",
  },
  { root: "apps/storybook/src" },
  { root: "apps/storybook/.storybook" },
]

const expectedExports = {
  "packages/infra/ai/package.json": [
    "./lifecycle",
    "./mastra-runtime",
    "./openai-client",
  ],
  "packages/infra/auth/package.json": [
    "./admin/client",
    "./admin/server",
    "./learner/client",
    "./learner/server",
    "./password",
    "./schema",
    "./session-token",
    "./sqlite-database",
  ],
  "packages/infra/db/package.json": [
    "./client",
    "./content/content-archive-policy",
    "./content/curriculum-version-id",
    "./content/normalize-versioned-step-content",
    "./database-backup",
    "./destructive-operation-guard",
    "./migrations/curriculum-migration",
    "./migrations/migrate",
    "./persisted-values",
    "./schema",
    "./seed",
    "./seeds/seed",
    "./seeds/seed-content",
    "./sqlite-database",
  ],
  "packages/infra/event-bus/package.json": ["./in-memory-event-bus"],
  "packages/infra/http-client/package.json": [
    "./api-result",
    "./json-transport",
  ],
  "packages/infra/http-platform/package.json": [
    "./context",
    "./core",
    "./errors",
    "./openapi",
    "./request-logging",
    "./security",
    "./zod",
  ],
  "packages/infra/observability/package.json": [
    "./events",
    "./lifecycle",
    "./logger",
    "./request-logger",
    "./security-audit-logger",
  ],
  "packages/infra/storage/package.json": ["./object-storage"],
  "packages/shared/contracts/package.json": [
    "./ai-feedback/feedback",
    "./auth-session-cookie",
    "./content/admin-courses",
    "./content/admin-data",
    "./content/course",
    "./content/ids",
    "./content/status",
    "./content/steps",
    "./identity/admin-ids",
    "./identity/admin-session",
    "./identity/admin-users",
    "./identity/data",
    "./identity/status",
    "./learning/api-error",
    "./learning/ids",
    "./learning/learner-api",
    "./learning/learner-content",
    "./learning/learner-read-model",
    "./learning/learner-transition",
    "./learning/read-data",
    "./learning/status",
    "./learning/step-data",
    "./operations/admin-ai-chat",
    "./operations/admin-analytics",
    "./operations/admin-api-error",
    "./operations/admin-content-reset",
    "./operations/admin-dashboard",
    "./operations/admin-settings",
    "./operations/ai-chat-data",
    "./operations/content-reset-data",
    "./operations/dashboard-analytics-data",
    "./operations/settings-data",
    "./resource-library/admin-resource-documents",
    "./resource-library/admin-resource-search",
    "./resource-library/admin-resource-tree",
    "./resource-library/data",
    "./resource-library/shared",
  ],
  "packages/core/package.json": [
    "./admin",
    "./ai-feedback",
    "./auth",
    "./content",
    "./learning",
    "./resource-library",
  ],
  "packages/config/env/package.json": [
    "./local-runtime-defaults",
    "./parse-env",
  ],
  "packages/config/nextjs-config/package.json": [
    "./csp-report",
    "./security-headers",
  ],
  "packages/config/typescript-config/package.json": [
    "./base.json",
    "./nextjs.json",
    "./react-library.json",
  ],
  "packages/shared/errors/package.json": [
    "./infrastructure-error",
    "./transport-error",
  ],
  "packages/shared/event-contracts/package.json": ["./workspace-event"],
  "packages/shared/kernel/package.json": [
    "./clock",
    "./domain-event",
    "./result",
  ],
  "packages/shared/resource-document/package.json": [
    "./resource-horizontal-rule",
    "./resource-image",
    "./resource-markdown",
    "./resource-markdown-validation",
    "./resource-table",
  ],
  "packages/shared/types/package.json": ["./brand", "./ids"],
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
  "packages/shared/ui/src/components/lesson/match-presentation.ts",
  "packages/shared/ui/src/lib/lesson-draft-storage.ts",
] as const
const removedArchitectureToolingPaths = [
  "packages/auth/package.json",
  "packages/contracts/package.json",
  "packages/db/package.json",
  "packages/http-client/package.json",
  "packages/resource-document/package.json",
  "packages/repository-tooling/package.json",
  "packages/ui/package.json",
  "scripts/check-architecture-boundaries.ts",
  "scripts/check-import-cycles.ts",
  "scripts/architecture/core-capability-policy.mjs",
] as const
const allowedSharedErrorNames = new Set([
  "InfrastructureError",
  "TransportError",
])
const forbiddenResourceDocumentOwnershipFilePattern =
  /(?:^|[/.-])(?:asset-lifecycle|document-save|permission|repository|tree)(?:[/.-]|$)/u
const forbiddenSharedUiIoPattern =
  /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(|["']use server["']/u
const canonicalIdNames = new Set([
  "AdminId",
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

for (const removedPath of removedArchitectureToolingPaths) {
  if (fs.existsSync(path.join(repositoryRoot, removedPath))) {
    failures.push(`${removedPath} -> 제거된 architecture tooling 재도입`)
  }
}

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

for (const filePath of collectSourceFiles(
  path.join(repositoryRoot, "packages/shared/kernel/src")
)) {
  const source = fs.readFileSync(filePath, "utf8")
  if (/\bprocess\s*\.\s*env\b/u.test(source)) {
    failures.push(`${relativePath(filePath)} -> kernel의 process.env 접근 금지`)
  }
}

for (const filePath of collectSourceFiles(
  path.join(repositoryRoot, "packages/shared/errors/src")
)) {
  if (/\.(?:test|typecheck)\.[jt]sx?$/u.test(filePath)) continue

  for (const symbol of readTopLevelDeclarationNames(filePath)) {
    if (symbol.endsWith("Error") && !allowedSharedErrorNames.has(symbol)) {
      failures.push(
        `${relativePath(filePath)} -> module domain 오류 ${symbol}의 shared 노출 금지`
      )
    }
  }
}

for (const filePath of collectSourceFiles(
  path.join(repositoryRoot, "packages/shared/contracts/src")
)) {
  const relative = relativePath(filePath)
  if (
    /(?:^|[/.-])openapi(?:[/.-]|$)|(?:^|[/.-])generated-client(?:[/.-]|$)|\.generated\./u.test(
      relative
    )
  ) {
    failures.push(`${relative} -> 정적 OpenAPI 또는 generated client 금지`)
  }
}

for (const filePath of collectSourceFiles(
  path.join(repositoryRoot, "packages/shared/resource-document/src")
)) {
  const relative = relativePath(filePath)
  if (forbiddenResourceDocumentOwnershipFilePattern.test(relative)) {
    failures.push(
      `${relative} -> 문서 tree·저장·권한·asset lifecycle 소유 금지`
    )
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

for (const transportPath of [
  "apps/admin/src/shared/http/admin-http-transport.ts",
  "apps/web/src/shared/http/openapi-client.ts",
]) {
  const source = fs.readFileSync(
    path.join(repositoryRoot, transportPath),
    "utf8"
  )
  if (
    !source.includes("requestHttpJson") ||
    !source.includes("schema: input.schema")
  ) {
    failures.push(`${transportPath} -> consumer success schema 전달 계약 누락`)
  }
}

const httpJsonTransportSource = fs.readFileSync(
  path.join(repositoryRoot, "packages/infra/http-client/src/json-transport.ts"),
  "utf8"
)
if (!httpJsonTransportSource.includes("input.schema.safeParse")) {
  failures.push(
    "packages/infra/http-client/src/json-transport.ts -> consumer success schema 실행 누락"
  )
}

verifyP3InfrastructureOwnership()
verifyDbModuleSchemaTransitionInventory()

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
for (const requiredPrefix of ["./components/lesson/", "./components/ui/"]) {
  if (
    !sharedUiExportKeys.some((exportKey) =>
      exportKey.startsWith(requiredPrefix)
    )
  ) {
    failures.push(
      `packages/shared/ui/package.json -> UI export 분류 ${requiredPrefix} 누락`
    )
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
  if (relative !== "packages/shared/types/src/ids.ts") {
    for (const symbol of readTopLevelDeclarationNames(filePath)) {
      if (canonicalIdNames.has(symbol)) {
        failures.push(`${relative} -> canonical ID ${symbol}의 중복 선언 금지`)
      }
    }
  }
  if (relative.startsWith("packages/core/")) continue
  if (relative.endsWith("/next-env.d.ts")) continue

  for (const source of readImports(filePath)) {
    if (
      source === "@workspace/repository-tooling" ||
      source.startsWith("@workspace/repository-tooling/")
    ) {
      failures.push(`${relative} -> 제거된 repository tooling ${source}`)
    }

    if (/^@workspace\/[^/]+\/src(?:\/|$)/u.test(source)) {
      failures.push(`${relative} -> workspace src deep import ${source}`)
    }

    if (/\.(?:[cm]?[jt]sx?)$/u.test(source)) {
      failures.push(`${relative} -> extension이 붙은 import ${source}`)
    }

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
      source === "@workspace/env" ||
      source === "@workspace/nextjs-config"
    ) {
      failures.push(`${relative} -> root barrel ${source}`)
    }
  }
}

verifyTargetPackageInterfaces()

function verifyTargetPackageInterfaces(): void {
  for (const group of ["infra", "modules", "shared"] as const) {
    const groupRoot = path.join(repositoryRoot, "packages", group)
    if (!fs.existsSync(groupRoot)) continue

    for (const entry of fs.readdirSync(groupRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const manifestPath = path.join(groupRoot, entry.name, "package.json")
      if (!fs.existsSync(manifestPath)) continue

      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
        readonly exports?: Readonly<Record<string, unknown>>
        readonly name?: string
      }
      const relativeManifestPath = relativePath(manifestPath)
      const exportKeys = Object.keys(manifest.exports ?? {})

      if (exportKeys.length === 0) {
        failures.push(`${relativeManifestPath}는 explicit export가 필요함`)
      }
      for (const exportKey of exportKeys) {
        if (exportKey === "." || exportKey.includes("*")) {
          failures.push(
            `${relativeManifestPath} -> broad export ${exportKey} 금지`
          )
        }
      }

      if (typeof manifest.name === "string") {
        for (const filePath of collectSourceFiles(
          path.join(path.dirname(manifestPath), "src")
        )) {
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
  const providerOwners = [
    ["better-auth", "packages/infra/auth/"],
    ["openai", "packages/infra/ai/"],
    ["@mastra/", "packages/infra/ai/"],
    ["@aws-sdk/client-s3", "packages/infra/storage/"],
    ["pino", "packages/infra/observability/"],
    ["pino-pretty", "packages/infra/observability/"],
    ["emittery", "packages/infra/event-bus/"],
  ] as const

  for (const filePath of collectSourceFiles(infraRoot)) {
    const relative = relativePath(filePath)
    const source = fs.readFileSync(filePath, "utf8")
    if (/\bprocess\s*\.\s*env\b/u.test(source)) {
      failures.push(`${relative} -> infra package의 process.env 접근 금지`)
    }
    for (const imported of readImports(filePath)) {
      if (
        imported.startsWith("apps/") ||
        imported.startsWith("@/") ||
        imported.startsWith("@workspace/modules/")
      ) {
        failures.push(`${relative} -> infra의 app·module import ${imported}`)
      }
    }
  }

  for (const filePath of collectSourceFiles(repositoryRoot)) {
    if (filePath.includes(`${path.sep}node_modules${path.sep}`)) continue
    const relative = relativePath(filePath)
    for (const imported of readImports(filePath)) {
      for (const [provider, ownerRoot] of providerOwners) {
        if (
          (imported === provider || imported.startsWith(provider)) &&
          !relative.startsWith(ownerRoot)
        ) {
          failures.push(`${relative} -> ${provider} direct import owner 위반`)
        }
      }
    }

    if (
      /^(apps|packages)\//u.test(relative) &&
      !/(?:^|\/)scripts\//u.test(relative) &&
      !/\.(?:test|spec)\.[jt]sx?$/u.test(relative)
    ) {
      const source = fs.readFileSync(filePath, "utf8")
      if (/\bconsole\s*\.\s*(?:log|error)\s*\(/u.test(source)) {
        failures.push(`${relative} -> product source의 console.log/error 금지`)
      }
    }

    if (
      /(?:projection|outbox|reconciliation)/u.test(relative) &&
      readImports(filePath).some((imported) =>
        imported.startsWith("@workspace/event-bus/")
      )
    ) {
      failures.push(
        `${relative} -> durable consumer의 in-memory event bus 사용 금지`
      )
    }
  }

  for (const clientPath of [
    "packages/infra/auth/src/admin/client.ts",
    "packages/infra/auth/src/learner/client.ts",
    "packages/infra/auth/src/shared/client.ts",
  ]) {
    for (const imported of readImports(path.join(repositoryRoot, clientPath))) {
      if (
        imported === "@workspace/db" ||
        imported.startsWith("@workspace/db/") ||
        imported === "drizzle-orm" ||
        imported.startsWith("drizzle-orm/") ||
        imported === "better-auth"
      ) {
        failures.push(
          `${clientPath} -> client bundle의 server·DB·ORM ${imported}`
        )
      }
    }
  }

  const aiRoot = path.join(repositoryRoot, "packages/infra/ai/src")
  for (const filePath of collectSourceFiles(aiRoot)) {
    const relative = relativePath(filePath)
    const source = fs.readFileSync(filePath, "utf8")
    if (/\b(?:prompt|coaching|attempt|productDto)\b/iu.test(source)) {
      failures.push(
        `${relative} -> AI infra의 제품 prompt·policy·DTO 소유 금지`
      )
    }
    for (const imported of readImports(filePath)) {
      if (
        imported.startsWith("@workspace/core/") ||
        imported.startsWith("@workspace/contracts/")
      ) {
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

  const httpPlatformRoot = path.join(
    repositoryRoot,
    "packages/infra/http-platform/src"
  )
  for (const filePath of collectSourceFiles(httpPlatformRoot)) {
    const relative = relativePath(filePath)
    if (/(?:repository|authorization-policy)/u.test(relative)) {
      failures.push(
        `${relative} -> HTTP platform의 제품 정책·repository 소유 금지`
      )
    }
    for (const imported of readImports(filePath)) {
      if (imported.startsWith("@workspace/core/")) {
        failures.push(
          `${relative} -> HTTP platform의 module error·policy import ${imported}`
        )
      }
    }
  }
}

function verifyDbModuleSchemaTransitionInventory(): void {
  const fixturePath = path.join(
    repositoryRoot,
    "scripts/fixtures/infra-db-module-schema-transition.json"
  )
  const transition = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Record<
    string,
    string
  >
  const schemaDirectory = path.join(
    repositoryRoot,
    "packages/infra/db/src/schema"
  )
  const schemaFiles = fs
    .readdirSync(schemaDirectory)
    .filter((fileName) => fileName.endsWith(".schema.ts"))
    .map((fileName) => `packages/infra/db/src/schema/${fileName}`)

  for (const schemaPath of schemaFiles) {
    if (!(schemaPath in transition)) {
      failures.push(`${schemaPath} -> P4~P9 제거 ID mapping 누락`)
    }
  }
  for (const [transitionPath, removalId] of Object.entries(transition)) {
    if (!/^P[4-9]-\d{3}$/u.test(removalId)) {
      failures.push(`${transitionPath} -> 유효하지 않은 제거 ID ${removalId}`)
    }
    if (!fs.existsSync(path.join(repositoryRoot, transitionPath))) {
      failures.push(
        `${transitionPath} -> 완료된 전환 항목은 inventory에서도 제거해야 함`
      )
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
