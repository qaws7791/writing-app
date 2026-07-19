import fs from "node:fs"
import path from "node:path"

import {
  createRepositoryWorkspaceInventory,
  formatWorkspaceInventoryError,
} from "@workspace/repository-tooling"

type JsonRecord = Record<string, unknown>

type WorkspacePackage = {
  readonly directory: string
  readonly exports: readonly string[]
  readonly name: string
  readonly scripts: ReadonlySet<string>
}

export type Route = {
  readonly method: string
  readonly path: string
}

const markdownRoots = [
  "README.md",
  "CONTEXT.md",
  "ARCHITECTURE.md",
  "BACKEND.md",
  "FRONTEND.md",
  "DOMAIN.md",
  "GLOSSARY.md",
  "docs/design",
  "docs/engineering",
  "docs/product",
] as const

const historicalOrAnalysisDocumentPatterns = [
  /^docs\/engineering\/adr\//u,
  /^docs\/engineering\/monorepo-target-architecture-plan\//u,
] as const

const staleResourceLibraryPatterns = [
  { marker: "Yjs 투영", pattern: /Yjs (?:snapshot )?투영/u },
  {
    marker: "Yjs transaction",
    pattern: /(?:Yjs HTTP transaction|본문 Yjs transaction)/u,
  },
  {
    marker: "Yjs 동기화 런타임",
    pattern: /(?:Yjs 연결·|Yjs 동기화 boundary|Yjs payload|Y\.Doc)/u,
  },
  {
    marker: "자료실 작업 공간 연결",
    pattern:
      /(?:ResourceWorkspaceSync|\/resources\/events|자료실 이벤트 WebSocket|작업 공간 사건 WebSocket|WebSocket connector)/u,
  },
  {
    marker: "자료실 동기화 이벤트",
    pattern:
      /(?:resource-document\.sync\.rejected|resource-tree\.revision-gap|transaction receipt 10,000개|snapshot fallback|sync snapshot)/u,
  },
  {
    marker: "깊이 제한 없는 트리",
    pattern: /(?:무제한 자료 트리|무제한 폴더|깊이 제한 없이)/u,
  },
  {
    marker: "자동 공동 편집",
    pattern:
      /(?:저장 버튼 없이 공동 편집|공동 편집할 수 있다|GFM 공동 편집기)/u,
  },
] as const

const capabilityOwnershipNavigationSectionMarker =
  "## capability 소유권·대표 탐색 경로"

const capabilityOwnershipNavigationScenarios = [
  {
    label: "학습 단계 완료",
    rowPattern: /^\|\s*학습 단계 완료\s*\|/mu,
    sourceMarkers: [
      "[공개 계약](../../packages/contracts/src/learning/learner-api.ts)",
      "[순수 policy](../../packages/core/src/modules/learning/domain/complete-step-effect-plan.ts)",
      "[app-owned adapter](../../apps/api/src/adapters/learning/learner-transition-drizzle.repository.ts)",
      "[composition](../../apps/api/src/learner-api-core.ts)",
      "[route](../../apps/api/src/modules/learning/learner-transition.routes.ts)",
    ],
  },
  {
    label: "관리자 content 발행",
    rowPattern: /^\|\s*관리자 content 발행\s*\|/mu,
    sourceMarkers: [
      "[공개 계약](../../packages/contracts/src/admin/content-data.ts)",
      "[순수 use case](../../packages/core/src/modules/content/application/use-cases/admin-course.use-case.ts)",
      "[app-owned adapter](../../apps/api/src/adapters/content/admin-course-drizzle.repository.ts)",
      "[composition](../../apps/api/src/modules/admin-content/admin-content.composition.ts)",
      "[route](../../apps/api/src/modules/admin-content/curriculum-editor.routes.ts)",
    ],
  },
  {
    label: "자료실 문서 조회",
    rowPattern: /^\|\s*자료실 문서 조회\s*\|/mu,
    sourceMarkers: [
      "[공개 계약](../../packages/contracts/src/admin/resource-library-data.ts)",
      "[문서 wire 계약](../../packages/contracts/src/admin/admin-resource-documents.ts)",
      "[순수 use case](../../packages/core/src/modules/resource-library/application/use-cases/resource-document.use-case.ts)",
      "[app-owned adapter](../../apps/api/src/adapters/resource-library/resource-document-drizzle.repository.ts)",
      "[composition](../../apps/api/src/modules/admin-resource-library/admin-resource-library.composition.ts)",
      "[route](../../apps/api/src/modules/admin-resource-library/resource-documents.routes.ts)",
    ],
  },
] as const

const capabilityOwnershipNavigationRequiredMarkers = [
  {
    label: "단일 backend executable 상태",
    marker:
      "product backend executable은 `apps/api` 하나이며 learner/admin Host sub-app을 함께 소유한다.",
  },
  {
    label: "target-only 계약 상태",
    marker:
      "관리자 foundation과 여섯 capability는 legacy subprocess 없이 target-only 계약 suite로 검증한다.",
  },
] as const

const repositoryRoot = process.cwd()
const failures: string[] = []

function readJsonFile(filePath: string): JsonRecord {
  const value: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"))

  if (!isRecord(value)) {
    throw new Error(`${filePath} must contain a JSON object.`)
  }

  return value
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readScripts(value: unknown): ReadonlySet<string> {
  if (!isRecord(value)) {
    return new Set()
  }

  return new Set(Object.keys(value))
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll(path.sep, "/")
}

export function isDocumentDriftMarkdownPath(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath)

  if (!normalizedPath.endsWith(".md")) {
    return false
  }

  return markdownRoots.some((rootPath) =>
    rootPath.endsWith(".md")
      ? normalizedPath === rootPath
      : normalizedPath.startsWith(`${rootPath}/`)
  )
}

export function isHistoricalOrAnalysisDocumentPath(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath)

  return historicalOrAnalysisDocumentPatterns.some((pattern) =>
    pattern.test(normalizedPath)
  )
}

export function findStaleResourceLibraryStatements(
  filePath: string,
  content: string
): ReadonlyArray<{ readonly line: number; readonly marker: string }> {
  const normalizedPath = normalizePath(filePath)

  if (isHistoricalOrAnalysisDocumentPath(normalizedPath)) {
    return []
  }

  return content
    .split(/\r?\n/u)
    .flatMap((line, index) =>
      staleResourceLibraryPatterns
        .filter(({ pattern }) => pattern.test(line))
        .map(({ marker }) => ({ line: index + 1, marker }))
    )
}

export function findCapabilityOwnershipNavigationDrift(
  content: string
): readonly string[] {
  const findings = capabilityOwnershipNavigationRequiredMarkers
    .filter(({ marker }) => !content.includes(marker))
    .map(({ label }) => `${label} marker`)

  if (!content.includes(capabilityOwnershipNavigationSectionMarker)) {
    findings.push("capability 소유권·대표 탐색 경로 section")
  }

  for (const scenario of capabilityOwnershipNavigationScenarios) {
    const scenarioIndex = content.search(scenario.rowPattern)

    if (scenarioIndex === -1) {
      findings.push(`${scenario.label} scenario`)
    }

    const sourceMarkerIndexes = scenario.sourceMarkers.map((marker) =>
      content.indexOf(marker)
    )

    for (const [index, markerIndex] of sourceMarkerIndexes.entries()) {
      if (markerIndex === -1) {
        findings.push(
          `${scenario.label} ${scenario.sourceMarkers[index] ?? "unknown"} source link`
        )
      }
    }

    if (
      scenarioIndex !== -1 &&
      sourceMarkerIndexes.every((markerIndex) => markerIndex !== -1) &&
      [scenarioIndex, ...sourceMarkerIndexes].some(
        (markerIndex, index) =>
          index > 0 &&
          markerIndex <=
            ([scenarioIndex, ...sourceMarkerIndexes][index - 1] ?? -1)
      )
    ) {
      findings.push(`${scenario.label} source link order`)
    }
  }

  return findings
}

function collectMarkdownFiles(): string[] {
  return markdownRoots.flatMap((rootPath) => {
    const absolutePath = path.join(repositoryRoot, rootPath)

    if (!fs.existsSync(absolutePath)) {
      return []
    }

    const stat = fs.statSync(absolutePath)

    if (stat.isFile()) {
      return rootPath.endsWith(".md") ? [rootPath] : []
    }

    return collectFiles(absolutePath)
      .filter((filePath) => filePath.endsWith(".md"))
      .map((filePath) => normalizePath(path.relative(repositoryRoot, filePath)))
  })
}

function collectFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath]
  })
}

function readWorkspacePackages(): Map<string, WorkspacePackage> {
  const result = createRepositoryWorkspaceInventory(repositoryRoot)

  if (result.status === "failure") {
    failures.push(...result.errors.map(formatWorkspaceInventoryError))
    return new Map()
  }

  return new Map(
    result.inventory.allWorkspaces.map((workspace) => [
      workspace.name,
      {
        directory: workspace.directory,
        exports: workspace.exportEntries.map(({ key }) => key),
        name: workspace.name,
        scripts: new Set(Object.keys(workspace.scripts)),
      },
    ])
  )
}

function validateDocumentedCommands(
  markdownFiles: readonly string[],
  packages: ReadonlyMap<string, WorkspacePackage>
) {
  const rootPackageJson = readJsonFile(
    path.join(repositoryRoot, "package.json")
  )
  const rootScripts = readScripts(rootPackageJson["scripts"])
  const packageNames = new Set(packages.keys())

  for (const filePath of markdownFiles) {
    if (isHistoricalOrAnalysisDocumentPath(filePath)) {
      continue
    }

    const content = fs.readFileSync(path.join(repositoryRoot, filePath), "utf8")

    for (const command of content.matchAll(/\bbun run ([\w:.-]+)/g)) {
      const scriptName = command[1] ?? ""

      if (scriptName.startsWith("--")) {
        continue
      }

      if (!rootScripts.has(scriptName)) {
        failures.push(
          `${filePath} references missing root script ${scriptName}.`
        )
      }
    }

    for (const command of content.matchAll(
      /\bbun (?:run )?--filter(?:=|\s+)([^\s`]+) ([\w:.-]+)/g
    )) {
      const packageName = command[1] ?? ""
      const scriptName = command[2] ?? ""
      const workspacePackage = packages.get(packageName)

      if (!packageNames.has(packageName) || workspacePackage === undefined) {
        failures.push(`${filePath} references missing package ${packageName}.`)
        continue
      }

      if (!workspacePackage.scripts.has(scriptName)) {
        failures.push(
          `${filePath} references missing ${packageName} script ${scriptName}.`
        )
      }
    }
  }
}

function validateDocumentedWorkspaceImports(
  markdownFiles: readonly string[],
  packages: ReadonlyMap<string, WorkspacePackage>
) {
  for (const filePath of markdownFiles) {
    if (isHistoricalOrAnalysisDocumentPath(filePath)) {
      continue
    }

    const content = fs.readFileSync(path.join(repositoryRoot, filePath), "utf8")

    for (const match of content.matchAll(
      /@workspace\/[a-z0-9-]+(?:\/[A-Za-z0-9._{}/*-]+)?/g
    )) {
      const specifier = match[0] ?? ""

      if (specifier.includes("{") || specifier.includes("*")) {
        continue
      }

      validateWorkspaceImport(filePath, specifier, packages)
    }
  }
}

function validateWorkspaceImport(
  filePath: string,
  specifier: string,
  packages: ReadonlyMap<string, WorkspacePackage>
) {
  const [, packageSegment = "", subpath = ""] =
    specifier.match(/^(@workspace\/[a-z0-9-]+)(?:\/(.+))?$/) ?? []
  const workspacePackage = packages.get(packageSegment)

  if (workspacePackage === undefined) {
    failures.push(`${filePath} references missing package ${packageSegment}.`)
    return
  }

  if (subpath.length === 0) {
    return
  }

  const exportKey = `./${subpath}`

  if (!hasExport(workspacePackage.exports, exportKey)) {
    failures.push(`${filePath} references missing export ${specifier}.`)
  }
}

function hasExport(exports: readonly string[], exportKey: string): boolean {
  return exports.some((candidate) => {
    if (candidate === exportKey) {
      return true
    }

    if (!candidate.endsWith("*")) {
      return false
    }

    return exportKey.startsWith(candidate.slice(0, -1))
  })
}

function validateBackendRouteDocumentation() {
  const backendDocument = fs.readFileSync(
    path.join(repositoryRoot, "BACKEND.md"),
    "utf8"
  )
  const documentedApiRoutes = extractDocumentedRoutes(
    backendDocument,
    "## `apps/api`",
    "## `packages/core`"
  )

  reportRouteDrift({
    actualRoutes: readApiRoutes(),
    documentedRoutes: documentedApiRoutes,
    label: "BACKEND.md apps/api routes",
  })
}

function validateCanonicalOnboardingDocumentation() {
  const stalePatterns = [
    {
      filePath: "apps/web/README.md",
      patterns: [/same-origin 인증 프록시/u, /src\/app.*인증 프록시/u],
    },
    {
      filePath: "DOMAIN.md",
      patterns: [/type CurriculumNodeStatus = .*deprecated/u],
    },
    {
      filePath: "GLOSSARY.md",
      patterns: [/^- 챕터:/mu, /^- deprecated:/mu],
    },
    {
      filePath: "apps/storybook/README.md",
      patterns: [/^## Commands$/mu, /^## Scope$/mu, /^## Notes$/mu],
    },
  ] as const

  for (const { filePath, patterns } of stalePatterns) {
    const content = fs.readFileSync(path.join(repositoryRoot, filePath), "utf8")

    for (const pattern of patterns) {
      if (pattern.test(content)) {
        failures.push(`${filePath} contains stale onboarding text: ${pattern}.`)
      }
    }
  }

  if (fs.existsSync(path.join(repositoryRoot, "docs/product/index.md"))) {
    failures.push(
      "docs/product/index.md duplicates the canonical docs/product/_index.md."
    )
  }
}

function validateCurrentResourceLibraryDocumentation(
  markdownFiles: readonly string[]
) {
  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(path.join(repositoryRoot, filePath), "utf8")

    for (const finding of findStaleResourceLibraryStatements(
      filePath,
      content
    )) {
      failures.push(
        `${filePath}:${finding.line} contains stale resource library current-state marker: ${finding.marker}.`
      )
    }
  }
}

function validateCapabilityOwnershipNavigationDocumentation() {
  const filePath = "docs/engineering/system-overview.md"
  const content = fs.readFileSync(path.join(repositoryRoot, filePath), "utf8")

  for (const finding of findCapabilityOwnershipNavigationDrift(content)) {
    failures.push(`${filePath} is missing ${finding}.`)
  }
}

function extractDocumentedRoutes(
  document: string,
  startHeading: string,
  endHeading: string
): Route[] {
  const startIndex = document.indexOf(startHeading)
  const endIndex = document.indexOf(endHeading)

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    failures.push(`Could not find route section ${startHeading}.`)
    return []
  }

  const section = document.slice(startIndex, endIndex)
  const routePattern = /\b(GET|POST|PUT|PATCH|DELETE) ([^`,\n]+)/g

  return [...section.matchAll(routePattern)].map((match) => ({
    method: match[1] ?? "",
    path: normalizeRoutePath(match[2] ?? ""),
  }))
}

function normalizeRoutePath(routePath: string): string {
  const pathWithoutQuery = routePath.trim().split("?")[0] ?? ""

  return (
    pathWithoutQuery.replaceAll(/\{([^}]+)\}/g, ":$1").replace(/\/$/, "") || "/"
  )
}

function readApiRoutes(): Route[] {
  const routeFiles = collectFiles(path.join(repositoryRoot, "apps/api/src"))
    .filter((filePath) => filePath.endsWith(".routes.ts"))
    .map((filePath) => fs.readFileSync(filePath, "utf8"))
  const routePattern = /^\s*method:\s*"([a-z]+)"[\s\S]*?^\s*path:\s*"([^"]+)"/gm
  const routes = routeFiles.flatMap((content) =>
    [...content.matchAll(routePattern)].map((match) => ({
      method: (match[1] ?? "").toUpperCase(),
      path: normalizeRoutePath(match[2] ?? ""),
    }))
  )

  return [
    ...routes,
    {
      method: "GET",
      path: "/openapi",
    },
    {
      method: "GET",
      path: "/api/auth/*",
    },
    {
      method: "POST",
      path: "/api/auth/*",
    },
    {
      method: "GET",
      path: "/session",
    },
  ]
}

function reportRouteDrift({
  actualRoutes,
  documentedRoutes,
  label,
}: {
  readonly actualRoutes: readonly Route[]
  readonly documentedRoutes: readonly Route[]
  readonly label: string
}) {
  const drift = findRouteDrift(actualRoutes, documentedRoutes)

  for (const route of drift.missing) {
    failures.push(`${label} is missing ${route}.`)
  }

  for (const route of drift.stale) {
    failures.push(`${label} documents stale route ${route}.`)
  }
}

export function findRouteDrift(
  actualRoutes: readonly Route[],
  documentedRoutes: readonly Route[]
) {
  const actual = new Set(actualRoutes.map(formatRoute))
  const documented = new Set(documentedRoutes.map(formatRoute))

  return {
    missing: [...actual].filter((route) => !documented.has(route)).sort(),
    stale: [...documented].filter((route) => !actual.has(route)).sort(),
  }
}

function formatRoute(route: Route): string {
  return `${route.method} ${route.path}`
}

function main() {
  const markdownFiles = collectMarkdownFiles()
  const packages = readWorkspacePackages()

  validateDocumentedCommands(markdownFiles, packages)
  validateDocumentedWorkspaceImports(markdownFiles, packages)
  validateBackendRouteDocumentation()
  validateCanonicalOnboardingDocumentation()
  validateCurrentResourceLibraryDocumentation(markdownFiles)
  validateCapabilityOwnershipNavigationDocumentation()

  if (failures.length > 0) {
    console.error("Document drift check failed.")

    for (const failure of failures) {
      console.error(`- ${failure}`)
    }

    process.exit(1)
  }

  console.log("Document drift smoke checks passed.")
}

if (import.meta.main) {
  main()
}
