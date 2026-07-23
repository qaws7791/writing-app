import fs from "node:fs"
import path from "node:path"
import { createHash } from "node:crypto"
import ts from "typescript"

import { findReintroducedDbInfrastructurePaths } from "#scripts/package-interface-tombstones"

type PrivateImportScope = {
  readonly packageName?: string
  readonly root: string
}

const repositoryRoot = process.cwd()
const sourceExtensions = new Set([".ts", ".tsx", ".mdx"])
const failures: string[] = []
const privateImportScopes: readonly PrivateImportScope[] = [
  { packageName: "@workspace/auth", root: "packages/infra/auth/src" },
  {
    packageName: "@workspace/ai-feedback",
    root: "packages/modules/ai-feedback/src",
  },
  {
    packageName: "@workspace/content",
    root: "packages/modules/content/src",
  },
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
    packageName: "@workspace/identity",
    root: "packages/modules/identity/src",
  },
  {
    packageName: "@workspace/learning",
    root: "packages/modules/learning/src",
  },
  {
    packageName: "@workspace/operations",
    root: "packages/modules/operations/src",
  },
  {
    packageName: "@workspace/resource-library",
    root: "packages/modules/resource-library/src",
  },
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
    "./migration",
    "./password",
    "./schema",
    "./seed",
    "./session-token",
    "./sqlite-database",
  ],
  "packages/infra/db/package.json": [
    "./client",
    "./database-backup",
    "./destructive-operation-guard",
    "./migration-runner",
    "./persisted-values",
    "./sqlite-database",
    "./test-support/application-migration",
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
    "./content/admin-content-reset",
    "./content/admin-data",
    "./content/admin-routes",
    "./content/api-error",
    "./content/course",
    "./content/ids",
    "./content/status",
    "./content/steps",
    "./identity/admin-ids",
    "./identity/admin-session",
    "./identity/admin-users",
    "./identity/api-error",
    "./identity/data",
    "./identity/learner-profile",
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
    "./operations/admin-ai-proposals",
    "./operations/admin-analytics",
    "./operations/admin-api-error",
    "./operations/admin-dashboard",
    "./operations/admin-settings",
    "./operations/analytics-query",
    "./resource-library/admin-resource-documents",
    "./resource-library/admin-resource-search",
    "./resource-library/admin-resource-tree",
    "./resource-library/data",
    "./resource-library/shared",
  ],
  "packages/config/env/package.json": [
    "./local-runtime-defaults",
    "./parse-env",
  ],
  "packages/config/nextjs-config/package.json": [
    "./csp-report",
    "./image-optimizer-security",
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
  "packages/modules/identity/package.json": [
    "./admin-actor",
    "./application",
    "./http",
    "./migration",
    "./module",
    "./ports",
    "./queries",
    "./reporting",
    "./schema",
    "./seed",
    "./sessions",
    "./user-status",
  ],
  "packages/modules/content/package.json": [
    "./application",
    "./commands",
    "./http",
    "./migration",
    "./module",
    "./normalization",
    "./ports",
    "./queries",
    "./schema",
    "./seed",
  ],
  "packages/modules/ai-feedback/package.json": [
    "./application",
    "./http",
    "./migration",
    "./module",
    "./ports",
    "./provider",
    "./schema",
  ],
  "packages/modules/learning/package.json": [
    "./application",
    "./http",
    "./mapping",
    "./migration",
    "./module",
    "./ports",
    "./queries",
    "./reporting",
    "./schema",
  ],
  "packages/modules/operations/package.json": [
    "./application",
    "./http",
    "./migration",
    "./module",
    "./ports",
    "./schema",
  ],
  "packages/modules/resource-library/package.json": [
    "./commands",
    "./http",
    "./migration",
    "./module",
    "./ports",
    "./queries",
    "./reconciliation",
    "./schema",
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
const forbiddenUiPolicyFiles = [
  "packages/shared/ui/src/components/lesson/match-presentation.ts",
  "packages/shared/ui/src/lib/lesson-draft-storage.ts",
] as const
const removedFlatWorkspaceDirectories = [
  "packages/auth",
  "packages/auth-proxy",
  "packages/contracts",
  "packages/core",
  "packages/db",
  "packages/env",
  "packages/http-client",
  "packages/repository-tooling",
  "packages/resource-document",
  "packages/ui",
] as const
const removedArchitectureToolingPaths = [
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

for (const removedDirectory of removedFlatWorkspaceDirectories) {
  if (fs.existsSync(path.join(repositoryRoot, removedDirectory))) {
    failures.push(`${removedDirectory} -> 제거된 flat workspace 재도입`)
  }
}

for (const removedPath of findReintroducedDbInfrastructurePaths(
  repositoryRoot
)) {
  failures.push(`${removedPath} -> P11 application tooling 이전 뒤 재도입 금지`)
}

for (const removedPath of removedArchitectureToolingPaths) {
  if (fs.existsSync(path.join(repositoryRoot, removedPath))) {
    failures.push(`${removedPath} -> 제거된 architecture tooling 재도입`)
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
verifyP4IdentityOwnership()
verifyP5ContentOwnership()
verifyP6AiFeedbackOwnership()
verifyP7LearningOwnership()
verifyP8ResourceLibraryOwnership()
verifyP9OperationsOwnership()
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
      source.startsWith("@workspace/core/") ||
      source === "#core" ||
      source.startsWith("#core/")
    ) {
      failures.push(`${relative} -> 제거된 core package ${source}`)
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
  }
}

function verifyP4IdentityOwnership(): void {
  const removedIdentitySources = [
    "apps/api/src/adapters/auth/learner-profile-drizzle.repository.ts",
    "apps/api/src/adapters/identity/admin-user-drizzle.repository.ts",
    "apps/api/src/modules/admin-identity/admin-identity.routes.ts",
    "apps/api/src/modules/auth/auth.routes.ts",
    "apps/api/src/modules/profile/profile.routes.ts",
  ] as const

  for (const sourcePath of removedIdentitySources) {
    if (fs.existsSync(path.join(repositoryRoot, sourcePath))) {
      failures.push(`${sourcePath} -> 제거된 identity 소유권 source 재도입`)
    }
  }

  const identityRoot = path.join(
    repositoryRoot,
    "packages/modules/identity/src"
  )
  for (const filePath of collectSourceFiles(identityRoot)) {
    for (const imported of readImports(filePath)) {
      if (imported.startsWith("@workspace/auth")) {
        failures.push(
          `${relativePath(filePath)} -> identity module의 auth schema·runtime 직접 의존 ${imported}`
        )
      }
    }
  }

  const identityManifestPath = path.join(
    repositoryRoot,
    "packages/modules/identity/package.json"
  )
  const identityManifest = JSON.parse(
    fs.readFileSync(identityManifestPath, "utf8")
  ) as {
    readonly dependencies?: Readonly<Record<string, string>>
  }
  if (identityManifest.dependencies?.["@workspace/auth"] !== undefined) {
    failures.push(
      "packages/modules/identity/package.json -> identity module의 auth package 직접 의존 금지"
    )
  }

  const forbiddenOwnershipReferences = [
    [
      "packages/modules/learning/src/infrastructure/persistence/schema.ts",
      /\blearnerProfiles\b/u,
      "learning schema의 identity table 소유",
    ],
    [
      "packages/infra/auth/src/admin/server.ts",
      /additionalFields[\s\S]*\brole\b/u,
      "auth runtime의 제품 role 소유",
    ],
    [
      "packages/shared/contracts/src/learning/learner-api.ts",
      /learner(?:Profile|Session)ResponseSchema/u,
      "learning contract의 identity response 소유",
    ],
  ] as const

  for (const [
    sourcePath,
    pattern,
    description,
  ] of forbiddenOwnershipReferences) {
    const source = fs.readFileSync(
      path.join(repositoryRoot, sourcePath),
      "utf8"
    )
    if (pattern.test(source)) {
      failures.push(`${sourcePath} -> ${description} 금지`)
    }
  }
}

function verifyP5ContentOwnership(): void {
  const removedContentSources = [
    "apps/api/src/adapters/content/admin-course-drizzle.repository.ts",
    "apps/api/src/modules/admin-content/admin-content.routes.ts",
    "apps/api/src/modules/admin-content/courses.routes.ts",
    "apps/api/src/modules/admin-content/curriculum-editor.routes.ts",
    "packages/infra/db/src/content/content-archive-policy.ts",
    "packages/infra/db/src/content/curriculum-version-id.ts",
    "packages/infra/db/src/content/normalize-versioned-step-content.ts",
    "packages/infra/db/src/schema/content.schema.ts",
    "packages/infra/db/src/seeds/seed-content.ts",
    "packages/shared/contracts/src/operations/admin-content-reset.ts",
    "packages/shared/contracts/src/operations/content-reset-data.ts",
  ] as const

  for (const sourcePath of removedContentSources) {
    if (fs.existsSync(path.join(repositoryRoot, sourcePath))) {
      failures.push(`${sourcePath} -> 제거된 content 소유권 source 재도입`)
    }
  }

  const contentRoot = path.join(repositoryRoot, "packages/modules/content/src")
  for (const filePath of collectSourceFiles(contentRoot)) {
    for (const imported of readImports(filePath)) {
      if (
        imported.startsWith("@workspace/auth") ||
        imported.startsWith("@workspace/identity")
      ) {
        failures.push(
          `${relativePath(filePath)} -> content module의 auth·identity 직접 의존 ${imported}`
        )
      }
    }
  }

  const dbSchemaIndex = readOptionalSource(
    "packages/infra/db/src/schema/index.ts"
  )
  if (/content\.schema/u.test(dbSchemaIndex)) {
    failures.push(
      "packages/infra/db/src/schema/index.ts -> content schema 재공개 금지"
    )
  }
}

function verifyP6AiFeedbackOwnership(): void {
  const removedAiFeedbackSources = [
    "apps/api/src/adapters/ai-feedback/ai-feedback-drizzle.repository.ts",
    "apps/api/src/adapters/ai-feedback/openai-feedback-provider.ts",
    "apps/api/src/modules/ai-feedback/ai-feedback.routes.ts",
    "apps/api/src/modules/ai-feedback/ai-feedback.schemas.ts",
    "packages/infra/db/src/schema/feedback.schema.ts",
  ] as const

  for (const sourcePath of removedAiFeedbackSources) {
    if (fs.existsSync(path.join(repositoryRoot, sourcePath))) {
      failures.push(`${sourcePath} -> 제거된 ai-feedback 소유권 source 재도입`)
    }
  }

  const moduleRoot = path.join(
    repositoryRoot,
    "packages/modules/ai-feedback/src"
  )
  for (const filePath of collectSourceFiles(moduleRoot)) {
    for (const imported of readImports(filePath)) {
      if (
        imported.startsWith("@workspace/auth") ||
        imported.startsWith("@workspace/content") ||
        imported.startsWith("@workspace/identity")
      ) {
        failures.push(
          `${relativePath(filePath)} -> ai-feedback module의 다른 비즈니스 module 직접 의존 ${imported}`
        )
      }
    }
  }

  const moduleSchema = fs.readFileSync(
    path.join(
      repositoryRoot,
      "packages/modules/ai-feedback/src/infrastructure/persistence/schema.ts"
    ),
    "utf8"
  )
  if (/\bforeignKey\s*\(|\.references\s*\(/u.test(moduleSchema)) {
    failures.push(
      "packages/modules/ai-feedback/src/infrastructure/persistence/schema.ts -> cross-module FK 금지"
    )
  }

  const dbSchemaIndex = readOptionalSource(
    "packages/infra/db/src/schema/index.ts"
  )
  if (/feedback\.schema|aiFeedbackAttempts/u.test(dbSchemaIndex)) {
    failures.push(
      "packages/infra/db/src/schema/index.ts -> AI feedback schema 재공개 금지"
    )
  }

  const learningRepository = fs.readFileSync(
    path.join(
      repositoryRoot,
      "packages/modules/learning/src/infrastructure/persistence/learning-transition-drizzle-repository.ts"
    ),
    "utf8"
  )
  if (
    /aiFeedbackAttempts|@workspace\/ai-feedback\/schema/u.test(
      learningRepository
    )
  ) {
    failures.push(
      "packages/modules/learning/src/infrastructure/persistence/learning-transition-drizzle-repository.ts -> AI attempt table 직접 접근 금지"
    )
  }
}

function verifyP7LearningOwnership(): void {
  const removedLearningSources = [
    "apps/api/src/adapters/learning/identity-learning-report.ts",
    "apps/api/src/adapters/learning/learner-read-cursor-drizzle.ts",
    "apps/api/src/adapters/learning/learner-read-model-drizzle.repository.ts",
    "apps/api/src/adapters/learning/learner-transition-drizzle.repository.ts",
    "apps/api/src/modules/courses/courses.routes.ts",
    "apps/api/src/modules/learning/learner-transition.routes.ts",
    "apps/api/src/modules/lessons/lessons.routes.ts",
    "apps/api/src/modules/progress/progress.routes.ts",
    "packages/infra/db/src/schema/learning.schema.ts",
  ] as const

  for (const sourcePath of removedLearningSources) {
    if (fs.existsSync(path.join(repositoryRoot, sourcePath))) {
      failures.push(`${sourcePath} -> 제거된 learning 소유권 source 재도입`)
    }
  }

  const learningRoot = path.join(
    repositoryRoot,
    "packages/modules/learning/src"
  )
  for (const filePath of collectSourceFiles(learningRoot)) {
    for (const imported of readImports(filePath)) {
      if (
        imported.startsWith("@workspace/ai-feedback") ||
        imported.startsWith("@workspace/auth") ||
        imported.startsWith("@workspace/content") ||
        imported.startsWith("@workspace/identity")
      ) {
        failures.push(
          `${relativePath(filePath)} -> learning module의 다른 비즈니스 module 직접 의존 ${imported}`
        )
      }
    }
  }

  const moduleSchema = fs.readFileSync(
    path.join(
      repositoryRoot,
      "packages/modules/learning/src/infrastructure/persistence/schema.ts"
    ),
    "utf8"
  )
  if (/\.references\s*\(/u.test(moduleSchema)) {
    failures.push(
      "packages/modules/learning/src/infrastructure/persistence/schema.ts -> cross-module 단일-column FK 금지"
    )
  }
  const foreignColumnOwners = [
    ...moduleSchema.matchAll(/foreignColumns:\s*\[([\s\S]*?)\]/gu),
  ].map((match) => match[1] ?? "")
  if (
    foreignColumnOwners.length === 0 ||
    foreignColumnOwners.some(
      (columns) => !columns.includes("learnerCourseProgress")
    )
  ) {
    failures.push(
      "packages/modules/learning/src/infrastructure/persistence/schema.ts -> module 내부 FK만 허용"
    )
  }

  const dbSchemaIndex = readOptionalSource(
    "packages/infra/db/src/schema/index.ts"
  )
  if (
    /learning\.schema|learner(?:Activity|Course|Lesson)/u.test(dbSchemaIndex)
  ) {
    failures.push(
      "packages/infra/db/src/schema/index.ts -> learning schema 재공개 금지"
    )
  }
}

function verifyP8ResourceLibraryOwnership(): void {
  const removedResourceLibrarySources = [
    "apps/api/src/adapters/resource-library/resource-asset-drizzle.repository.ts",
    "apps/api/src/adapters/resource-library/resource-document-drizzle.repository.ts",
    "apps/api/src/adapters/resource-library/resource-search-drizzle.repository.ts",
    "apps/api/src/adapters/resource-library/resource-tree-drizzle.repository.ts",
    "apps/api/src/modules/admin-resource-library/admin-resource-library.routes.ts",
    "apps/api/src/modules/admin-resource-library/resource-documents.routes.ts",
    "apps/api/src/modules/admin-resource-library/resource-search.routes.ts",
    "apps/api/src/modules/admin-resource-library/resource-tree.routes.ts",
    "apps/api/src/resource-assets/resource-asset-store.ts",
    "apps/api/src/resource-assets/resource-image-file.ts",
    "packages/infra/db/src/schema/resource.schema.ts",
  ] as const

  for (const sourcePath of removedResourceLibrarySources) {
    if (fs.existsSync(path.join(repositoryRoot, sourcePath))) {
      failures.push(
        `${sourcePath} -> 제거된 resource-library 소유권 source 재도입`
      )
    }
  }

  const moduleRoot = path.join(
    repositoryRoot,
    "packages/modules/resource-library/src"
  )
  for (const filePath of collectSourceFiles(moduleRoot)) {
    for (const imported of readImports(filePath)) {
      if (
        imported.startsWith("@workspace/ai-feedback") ||
        imported.startsWith("@workspace/auth") ||
        imported.startsWith("@workspace/content") ||
        imported.startsWith("@workspace/identity") ||
        imported.startsWith("@workspace/learning") ||
        imported.startsWith("@workspace/operations")
      ) {
        failures.push(
          `${relativePath(filePath)} -> resource-library module의 다른 비즈니스 module 직접 의존 ${imported}`
        )
      }
    }
  }

  const moduleSchemaPath =
    "packages/modules/resource-library/src/infrastructure/persistence/schema.ts"
  const moduleSchema = fs.readFileSync(
    path.join(repositoryRoot, moduleSchemaPath),
    "utf8"
  )
  if (/adminAuth|admin_user|@workspace\/auth/u.test(moduleSchema)) {
    failures.push(
      `${moduleSchemaPath} -> auth table·schema cross-module FK 소유 금지`
    )
  }
  const referencedTables = [
    ...moduleSchema.matchAll(/\.references\(\s*\(\)\s*=>\s*([A-Za-z0-9_]+)/gu),
  ].map((match) => match[1] ?? "")
  if (
    referencedTables.length === 0 ||
    referencedTables.some(
      (table) =>
        table !== "adminResourceNodes" && table !== "adminResourceDocuments"
    )
  ) {
    failures.push(`${moduleSchemaPath} -> module 내부 FK만 허용`)
  }

  const dbSchemaIndex = readOptionalSource(
    "packages/infra/db/src/schema/index.ts"
  )
  if (
    /resource\.schema|adminResource(?:Nodes|Documents|Assets)/u.test(
      dbSchemaIndex
    )
  ) {
    failures.push(
      "packages/infra/db/src/schema/index.ts -> resource-library schema 재공개 금지"
    )
  }

  const commandPortPath =
    "packages/modules/resource-library/src/application/resource-document-command-port.ts"
  const commandPortSource = fs.readFileSync(
    path.join(repositoryRoot, commandPortPath),
    "utf8"
  )
  if (
    !commandPortSource.includes(
      "export type { ResourceDocumentCommandPort }"
    ) ||
    /export\s*\{(?!\s*type)/u.test(commandPortSource)
  ) {
    failures.push(
      `${commandPortPath} -> 관리자 AI에는 기존 document command type만 공개해야 함`
    )
  }
}

function verifyP9OperationsOwnership(): void {
  const removedOperationsSources = [
    "apps/api/src/adapters/ai-chat/admin-ai-chat-drizzle.repository.ts",
    "apps/api/src/adapters/ai-chat/admin-content-agent.ts",
    "apps/api/src/adapters/analytics/admin-analytics-drizzle.repository.ts",
    "apps/api/src/adapters/dashboard/admin-dashboard-drizzle.repository.ts",
    "apps/api/src/adapters/settings/admin-settings-drizzle.repository.ts",
    "apps/api/src/modules/admin-ai-chat/admin-ai-chat.routes.ts",
    "apps/api/src/modules/admin-dashboard-analytics/admin-dashboard-analytics.routes.ts",
    "apps/api/src/modules/admin-settings/admin-settings.routes.ts",
    "packages/infra/db/src/schema/admin.schema.ts",
  ] as const

  for (const sourcePath of removedOperationsSources) {
    if (fs.existsSync(path.join(repositoryRoot, sourcePath))) {
      failures.push(`${sourcePath} -> 제거된 operations 소유권 source 재도입`)
    }
  }

  const moduleRoot = path.join(
    repositoryRoot,
    "packages/modules/operations/src"
  )
  for (const filePath of collectSourceFiles(moduleRoot)) {
    for (const imported of readImports(filePath)) {
      if (
        imported.startsWith("@workspace/auth") ||
        imported.startsWith("@workspace/content") ||
        imported.startsWith("@workspace/identity") ||
        imported.startsWith("@workspace/learning") ||
        imported.startsWith("@workspace/resource-library")
      ) {
        failures.push(
          `${relativePath(filePath)} -> operations module의 다른 비즈니스 module 직접 의존 ${imported}`
        )
      }
    }
  }

  const schemaPath =
    "packages/modules/operations/src/infrastructure/persistence/schema.ts"
  const schema = fs.readFileSync(path.join(repositoryRoot, schemaPath), "utf8")
  if (/adminAuth|admin_user|@workspace\/auth/u.test(schema)) {
    failures.push(
      `${schemaPath} -> auth table·schema cross-module FK 소유 금지`
    )
  }
  const referencedTables = [
    ...schema.matchAll(/\.references\(\s*\(\)\s*=>\s*([A-Za-z0-9_]+)/gu),
  ].map((match) => match[1] ?? "")
  if (
    referencedTables.length === 0 ||
    referencedTables.some((table) => table !== "operationsAiConversations")
  ) {
    failures.push(`${schemaPath} -> operations module 내부 FK만 허용`)
  }

  const dbSchemaIndex = readOptionalSource(
    "packages/infra/db/src/schema/index.ts"
  )
  if (/adminAiChat|adminSettings|operationsAi/u.test(dbSchemaIndex)) {
    failures.push(
      "packages/infra/db/src/schema/index.ts -> operations schema 재공개 금지"
    )
  }

  const aiAdapterPath =
    "packages/modules/operations/src/infrastructure/ai/operations-mastra-provider.ts"
  const aiAdapter = fs.readFileSync(
    path.join(repositoryRoot, aiAdapterPath),
    "utf8"
  )
  for (const requiredGuard of [
    "Git",
    "저장소 코드",
    "프로젝트 문서",
    "파일 시스템",
  ]) {
    if (!aiAdapter.includes(requiredGuard)) {
      failures.push(
        `${aiAdapterPath} -> AI context 제외 guard ${requiredGuard} 누락`
      )
    }
  }
  if (/node:fs|node:child_process|exec_command|readFile/u.test(aiAdapter)) {
    failures.push(
      `${aiAdapterPath} -> repository·filesystem AI context 도구 금지`
    )
  }
}

function verifyP10ApiCompositionOwnership(): void {
  const requiredApiSources = [
    "apps/api/src/composition/create-app.ts",
    "apps/api/src/composition/create-container.ts",
    "apps/api/src/lifecycle/server-lifecycle.ts",
    "apps/api/src/runtime/system-clock.ts",
    "apps/api/src/runtime/uuid-generator.ts",
  ] as const
  const removedApiSources = [
    "apps/api/src/api-runtime.ts",
    "apps/api/src/app.ts",
    "apps/api/src/learner-api-core.ts",
    "apps/api/src/http/app.ts",
    "apps/api/src/server-lifecycle.ts",
    "apps/api/src/test-support/learner-api-shutdown-process.ts",
  ] as const

  for (const sourcePath of requiredApiSources) {
    if (!fs.existsSync(path.join(repositoryRoot, sourcePath))) {
      failures.push(`${sourcePath} -> P10 API composition source 누락`)
    }
  }
  for (const sourcePath of removedApiSources) {
    if (fs.existsSync(path.join(repositoryRoot, sourcePath))) {
      failures.push(`${sourcePath} -> 제거된 API runtime 중복 source 재도입`)
    }
  }

  const appOwnedModuleRoot = path.join(repositoryRoot, "apps/api/src/modules")
  if (
    fs.existsSync(appOwnedModuleRoot) &&
    collectSourceFiles(appOwnedModuleRoot).length > 0
  ) {
    failures.push(
      "apps/api/src/modules -> module HTTP interface 이전 뒤 app-owned module source 금지"
    )
  }

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
    for (const importedSource of readImports(filePath)) {
      if (importedSource.startsWith("#")) {
        failures.push(
          `${relative} -> API는 dependency package private alias ${importedSource}를 import할 수 없음`
        )
      }
    }
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
  const applicationMigrationPath = "apps/api/src/db/migrate.ts"
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

  const allowedModuleSchemaConsumers = new Set([
    applicationSchemaPath,
    "apps/api/src/scripts/setup-e2e-content-database.ts",
  ])
  const moduleSchemaImports = new Set(schemaImports.slice(1))
  const migrationImports = new Set(
    ["auth", ...modulePackages].map(
      (packageName) => `@workspace/${packageName}/migration`
    )
  )

  for (const filePath of collectSourceFiles(repositoryRoot)) {
    if (filePath.includes(`${path.sep}node_modules${path.sep}`)) continue
    const relative = relativePath(filePath)

    for (const imported of readImports(filePath)) {
      if (
        moduleSchemaImports.has(imported) &&
        !allowedModuleSchemaConsumers.has(relative)
      ) {
        failures.push(
          `${relative} -> module schema는 application schema·seed tooling 밖에서 import할 수 없음: ${imported}`
        )
      }
      if (
        migrationImports.has(imported) &&
        !relative.endsWith(".test.ts") &&
        relative !== applicationMigrationPath
      ) {
        failures.push(
          `${relative} -> module migration은 application migration composition 밖에서 실행할 수 없음: ${imported}`
        )
      }
      if (
        imported === "@workspace/db/test-support/application-migration" &&
        !relative.endsWith(".test.ts")
      ) {
        failures.push(
          `${relative} -> baseline test helper의 runtime import 금지`
        )
      }
    }
  }

  const expectedSeedOwners = new Set(["content", "identity"])
  for (const packageName of modulePackages) {
    const manifestPath = `packages/modules/${packageName}/package.json`
    const manifest = JSON.parse(
      fs.readFileSync(path.join(repositoryRoot, manifestPath), "utf8")
    ) as { readonly exports?: Readonly<Record<string, unknown>> }
    const exportsSeed = manifest.exports?.["./seed"] !== undefined
    if (exportsSeed !== expectedSeedOwners.has(packageName)) {
      failures.push(
        `${manifestPath} -> 실제 seed 소유 module만 ./seed를 export해야 함`
      )
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

  const migrations = [
    [
      "apps/api/drizzle/0000-writing-app-baseline.sql",
      "ca744dd3c34bdd604cfd3de4e57c44dc4299e67bb6685926e4d89aa5821bee25",
    ],
    [
      "apps/api/drizzle/0001-module-schema-ownership.sql",
      "20b1b8a424d4916b565f5b991f221ddc0708a1a654f0cfbeaf6627b53b2636b0",
    ],
  ] as const
  for (const [migrationPath, expectedChecksum] of migrations) {
    const migration = readOptionalSource(migrationPath).replace(/\r\n?/gu, "\n")
    const checksum = createHash("sha256").update(migration).digest("hex")
    if (checksum !== expectedChecksum) {
      failures.push(
        `${migrationPath} -> 고정 migration checksum 불일치: ${checksum}`
      )
    }
  }

  const dbManifest = JSON.parse(
    fs.readFileSync(
      path.join(repositoryRoot, "packages/infra/db/package.json"),
      "utf8"
    )
  ) as {
    readonly dependencies?: Readonly<Record<string, string>>
    readonly exports?: Readonly<Record<string, unknown>>
  }
  if (dbManifest.exports?.["./schema"] !== undefined) {
    failures.push("packages/infra/db/package.json -> schema 재공개 금지")
  }
  for (const dependency of Object.keys(dbManifest.dependencies ?? {})) {
    if (
      dependency === "@workspace/auth" ||
      modulePackages.some(
        (packageName) => dependency === `@workspace/${packageName}`
      )
    ) {
      failures.push(
        `packages/infra/db/package.json -> auth·business module 의존 금지: ${dependency}`
      )
    }
  }

  const createContainer = readOptionalSource(
    "apps/api/src/composition/create-container.ts"
  )
  if (!createContainer.includes("runApplicationMigrations(database.sqlite")) {
    failures.push(
      "apps/api/src/composition/create-container.ts -> 중앙 application migration 실행 누락"
    )
  }

  const reconciliation = readOptionalSource(
    "apps/api/src/db/schema-reconciliation.ts"
  )
  if (/\b(?:INNER|LEFT|RIGHT|FULL|CROSS)?\s*JOIN\b/iu.test(reconciliation)) {
    failures.push(
      "apps/api/src/db/schema-reconciliation.ts -> cross-module SQL JOIN 대신 독립 조회·application 조정 필요"
    )
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

  const storybookManifest = JSON.parse(
    fs.readFileSync(
      path.join(repositoryRoot, "apps/storybook/package.json"),
      "utf8"
    )
  ) as {
    readonly dependencies?: Readonly<Record<string, string>>
    readonly devDependencies?: Readonly<Record<string, string>>
  }
  const internalDependencies = [
    ...Object.keys(storybookManifest.dependencies ?? {}),
    ...Object.keys(storybookManifest.devDependencies ?? {}),
  ].filter((dependency) => dependency.startsWith("@workspace/"))

  for (const dependency of internalDependencies) {
    if (
      dependency !== "@workspace/typescript-config" &&
      dependency !== "@workspace/ui"
    ) {
      failures.push(
        `apps/storybook/package.json -> Storybook 내부 dependency ${dependency} 금지`
      )
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

    const modulePackageRoot = path.join(moduleRoot, moduleEntry.name)
    const tsconfigPath = path.join(modulePackageRoot, "tsconfig.json")
    const config = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
    if (config.error !== undefined) {
      failures.push(
        `${relativePath(tsconfigPath)} -> P13 decision type 검사 설정을 읽을 수 없음`
      )
      continue
    }
    const parsedConfig = ts.parseJsonConfigFileContent(
      config.config,
      ts.sys,
      modulePackageRoot
    )
    const program = ts.createProgram(
      parsedConfig.fileNames,
      parsedConfig.options
    )
    const typeChecker = program.getTypeChecker()

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
        const sourceFile = program.getSourceFile(filePath)
        if (sourceFile === undefined) {
          failures.push(`${relative} -> P13 decision type 검사 source 누락`)
          continue
        }
        for (const functionName of readNullBasedDecisionFunctions(
          sourceFile,
          typeChecker
        )) {
          failures.push(
            `${relative} -> ${functionName} expected decision의 null 반환 금지`
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

  verifyP13NullDecisionGateFixture()
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
    if (/\bemitSerial\s*\(/u.test(source)) {
      failures.push(`${relative} -> listener 순서 의존 emitSerial 금지`)
    }
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

function readNullBasedDecisionFunctions(
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
): readonly string[] {
  const functionNames = new Set<string>()
  const decisionName = /^(?:authorize|decide|reject|transition|validate)[A-Z]/u
  const inspectSignature = (
    name: string | undefined,
    declaration: ts.SignatureDeclaration
  ): void => {
    if (name === undefined || !decisionName.test(name)) return
    const signature = typeChecker.getSignatureFromDeclaration(declaration)
    if (
      signature !== undefined &&
      containsNullType(
        typeChecker.getReturnTypeOfSignature(signature),
        typeChecker
      )
    ) {
      functionNames.add(name)
    }
  }
  const inspectCallableDeclaration = (
    name: string | undefined,
    declaration:
      | ts.PropertyDeclaration
      | ts.PropertySignature
      | ts.VariableDeclaration
  ): void => {
    if (name === undefined || !decisionName.test(name)) return
    for (const signature of typeChecker
      .getTypeAtLocation(declaration)
      .getCallSignatures()) {
      if (containsNullType(signature.getReturnType(), typeChecker)) {
        functionNames.add(name)
      }
    }
  }
  const visit = (node: ts.Node): void => {
    if (ts.isFunctionDeclaration(node)) {
      inspectSignature(node.name?.text, node)
    } else if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) {
      inspectSignature(readDeclarationName(node.name), node)
    } else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      inspectSignature(readFunctionExpressionName(node), node)
    } else if (ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) {
      inspectCallableDeclaration(readDeclarationName(node.name), node)
    } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      inspectCallableDeclaration(node.name.text, node)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return [...functionNames].sort()
}

function containsNullType(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  seen = new Set<ts.Type>()
): boolean {
  if ((type.flags & ts.TypeFlags.Null) !== 0) return true
  if (seen.has(type)) return false
  seen.add(type)

  if (type.isUnionOrIntersection()) {
    return type.types.some((member) =>
      containsNullType(member, typeChecker, seen)
    )
  }
  if (
    type.aliasTypeArguments?.some((argument) =>
      containsNullType(argument, typeChecker, seen)
    ) === true
  ) {
    return true
  }
  if (
    (type.flags & ts.TypeFlags.Object) !== 0 &&
    ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) !== 0
  ) {
    return typeChecker
      .getTypeArguments(type as ts.TypeReference)
      .some((argument) => containsNullType(argument, typeChecker, seen))
  }
  if ((type.flags & ts.TypeFlags.TypeParameter) !== 0) {
    const constraint = typeChecker.getBaseConstraintOfType(type)
    return (
      constraint !== undefined &&
      containsNullType(constraint, typeChecker, seen)
    )
  }
  return false
}

function readDeclarationName(
  name: ts.PropertyName | undefined
): string | undefined {
  return name !== undefined && ts.isIdentifier(name) ? name.text : undefined
}

function readFunctionExpressionName(
  node: ts.ArrowFunction | ts.FunctionExpression
): string | undefined {
  if (ts.isFunctionExpression(node) && node.name !== undefined) {
    return node.name.text
  }
  const parent = node.parent
  if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
    return parent.name.text
  }
  if (
    (ts.isPropertyAssignment(parent) || ts.isPropertyDeclaration(parent)) &&
    ts.isIdentifier(parent.name)
  ) {
    return parent.name.text
  }
  return undefined
}

function verifyP13NullDecisionGateFixture(): void {
  const fixturePath = path.join(
    repositoryRoot,
    "scripts/fixtures/p13-null-decision-gate.ts"
  )
  const program = ts.createProgram([fixturePath], {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
  })
  const sourceFile = program.getSourceFile(fixturePath)
  if (sourceFile === undefined) {
    failures.push(
      `${relativePath(fixturePath)} -> P13 null decision gate fixture를 읽을 수 없음`
    )
    return
  }
  const detected = readNullBasedDecisionFunctions(
    sourceFile,
    program.getTypeChecker()
  )
  const expected = ["decideAliased", "transitionContextual", "validateInferred"]
  if (detected.join("\n") !== expected.join("\n")) {
    failures.push(
      `${relativePath(fixturePath)} -> P13 null decision gate 회귀: ${detected.join(", ")}`
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
