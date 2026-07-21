import {
  createRepositoryInventory,
  evaluateImportRatchet,
  formatImportEdge,
  type ImportEdge,
  type ModuleReference,
  type RepositoryFile,
} from "@workspace/repository-tooling"

import {
  approvedCoreCrossCapabilityImportMap,
  isForbiddenCoreCapabilityContractSource,
  readCoreCapabilityImportViolation,
} from "./architecture/core-capability-policy.mjs"

type ScheduledImportEdge = ImportEdge & {
  readonly removalTask: `MTA-${number}`
}

type ArchitectureRule = {
  readonly allowances: readonly ScheduledImportEdge[]
  readonly files: readonly RepositoryFile[]
  readonly id: string
  readonly matches: (input: {
    readonly file: RepositoryFile
    readonly reference: ModuleReference
  }) => boolean
}

const coreFiles = createRepositoryInventory({
  includeTests: false,
  root: "packages/core/src",
})
const coreFilesWithTests = createRepositoryInventory({
  includeTests: true,
  root: "packages/core/src",
})
const uiFiles = createRepositoryInventory({
  includeTests: false,
  root: "packages/ui/src",
})
const appFiles = createRepositoryInventory({
  includeTests: false,
  root: "apps",
})
const authFiles = createRepositoryInventory({
  includeTests: false,
  root: "packages/auth/src",
})
const directBetterAuthForbiddenFiles = [
  ...createRepositoryInventory({ includeTests: true, root: "apps" }),
  ...createRepositoryInventory({ includeTests: true, root: "scripts" }),
  ...createRepositoryInventory({ includeTests: true, root: "packages" }).filter(
    (file) => !file.path.replaceAll("\\", "/").includes("/packages/auth/")
  ),
]

const coreRuntimeAllowances =
  [] as const satisfies readonly ScheduledImportEdge[]

const rules: readonly ArchitectureRule[] = [
  {
    allowances: coreRuntimeAllowances,
    files: coreFiles,
    id: "core-runtime-adapter",
    matches: ({ reference }) => isCoreRuntimeDependency(reference.source),
  },
  {
    allowances: [],
    files: coreFilesWithTests,
    id: "core-capability-boundary",
    matches: ({ file, reference }) =>
      readCoreCapabilityImportViolation({
        moduleSource: reference.source,
        sourcePath: file.relativePath,
      }) !== null,
  },
  {
    allowances: [],
    files: coreFilesWithTests,
    id: "core-capability-contract-entrypoint",
    matches: ({ reference }) =>
      isForbiddenCoreCapabilityContractSource(reference.source),
  },
  {
    allowances: [],
    files: uiFiles,
    id: "ui-application-dependency",
    matches: ({ reference }) => isUiApplicationDependency(reference.source),
  },
  {
    allowances: [],
    files: appFiles,
    id: "frontend-persistence-dependency",
    matches: ({ file, reference }) =>
      isFrontendFile(file.relativePath) &&
      isPersistenceDependency(reference.source),
  },
  {
    allowances: [],
    files: appFiles,
    id: "frontend-core-dependency",
    matches: ({ file, reference }) =>
      isFrontendFile(file.relativePath) &&
      isWorkspacePackage(reference.source, "core"),
  },
  {
    allowances: [],
    files: appFiles,
    id: "api-transport-persistence-dependency",
    matches: ({ file, reference }) =>
      isApiTransportFile(file.relativePath) &&
      isPersistenceDependency(reference.source),
  },
  {
    allowances: [],
    files: directBetterAuthForbiddenFiles,
    id: "better-auth-vendor-boundary",
    matches: ({ reference }) =>
      isPackageImport(reference.source, "better-auth"),
  },
  {
    allowances: [],
    files: authFiles,
    id: "auth-client-server-boundary",
    matches: ({ file, reference }) =>
      isAuthClientFile(file.relativePath) &&
      isAuthClientServerDependency(reference.source),
  },
]

function runArchitectureBoundaryCheck(): void {
  const failures: string[] = []

  for (const rule of rules) {
    const result = evaluateImportRatchet(rule)

    if (result.status === "success") continue

    result.unexpectedEdges.forEach((edge) =>
      failures.push(`[${rule.id}] 신규 위반: ${formatImportEdge(edge)}`)
    )
    result.staleAllowances.forEach((edge) =>
      failures.push(
        `[${rule.id}] 제거된 위반의 allowance를 함께 삭제해야 함: ${formatImportEdge(edge)}`
      )
    )
  }

  if (failures.length > 0) {
    console.error("Architecture boundary ratchet failed.")
    failures.forEach((failure) => console.error(`- ${failure}`))
    process.exit(1)
  }

  console.log(
    `Architecture boundary ratchet passed across ${rules.length} rules, ${coreRuntimeAllowances.length} core runtime allowances, and ${readApprovedCoreCrossCapabilityImportCount()} approved cross-capability imports.`
  )
}

function isCoreRuntimeDependency(source: string): boolean {
  return (
    isWorkspacePackage(source, "db") ||
    isPackageImport(source, "better-auth") ||
    isPackageImport(source, "drizzle-orm") ||
    isPackageImport(source, "hono") ||
    isPackageImport(source, "@hono") ||
    isPackageImport(source, "@mastra") ||
    isWorkspacePackage(source, "hono") ||
    isWorkspacePackage(source, "ui") ||
    isPackageImport(source, "next") ||
    isPackageImport(source, "openai") ||
    isPackageImport(source, "react")
  )
}

function readApprovedCoreCrossCapabilityImportCount(): number {
  return Object.values(approvedCoreCrossCapabilityImportMap).reduce(
    (count, moduleSources) => count + moduleSources.length,
    0
  )
}

function isUiApplicationDependency(source: string): boolean {
  return (
    source.startsWith("@/") ||
    isWorkspacePackage(source, "admin") ||
    isWorkspacePackage(source, "api") ||
    isWorkspacePackage(source, "core") ||
    isWorkspacePackage(source, "db") ||
    isWorkspacePackage(source, "http-client") ||
    isWorkspacePackage(source, "web") ||
    isPackageImport(source, "better-auth") ||
    source === "next/navigation"
  )
}

function isFrontendFile(sourcePath: string): boolean {
  return (
    sourcePath.startsWith("admin/src/") || sourcePath.startsWith("web/src/")
  )
}

export function isAuthClientFile(sourcePath: string): boolean {
  return ["admin/client.ts", "learner/client.ts", "shared/client.ts"].includes(
    sourcePath
  )
}

export function isAuthClientServerDependency(source: string): boolean {
  return (
    isWorkspacePackage(source, "core") ||
    isWorkspacePackage(source, "db") ||
    isPackageImport(source, "drizzle-orm") ||
    source === "bun:sqlite" ||
    (isPackageImport(source, "better-auth") &&
      source !== "better-auth/client") ||
    (source.startsWith("#auth/") &&
      (source.includes("/server") ||
        source === "#auth/shared/auth-database-adapter"))
  )
}

export function isApiTransportFile(sourcePath: string): boolean {
  const appSourcePath = sourcePath.match(/^api\/src\/(.+)$/u)?.[1]

  if (appSourcePath === undefined) return false

  return (
    appSourcePath === "app.ts" ||
    appSourcePath.startsWith("admin/") ||
    appSourcePath.startsWith("http/") ||
    appSourcePath.startsWith("middleware/") ||
    appSourcePath.startsWith("routes/") ||
    (/^modules\/[^/]+\/[^/]+\.routes?\.ts$/u.test(appSourcePath) ?? false)
  )
}

function isPersistenceDependency(source: string): boolean {
  return (
    isWorkspacePackage(source, "db") || isPackageImport(source, "drizzle-orm")
  )
}

function isWorkspacePackage(source: string, packageName: string): boolean {
  return isPackageImport(source, `@workspace/${packageName}`)
}

function isPackageImport(source: string, packageName: string): boolean {
  return source === packageName || source.startsWith(`${packageName}/`)
}

if (import.meta.main) runArchitectureBoundaryCheck()
