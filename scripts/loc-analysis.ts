export const locCategories = [
  "source",
  "test/typecheck",
  "fixture/test-support",
  "story",
  "migration/generated",
  "docs",
  "config/operations",
] as const

export type LocCategory = (typeof locCategories)[number]

export type LocMetrics = {
  readonly blanks: number
  readonly bytes: number
  readonly code: number
  readonly comments: number
  readonly complexity: number
  readonly files: number
  readonly lines: number
}

export type SccFileRecord = LocMetrics & {
  readonly language: string
  readonly path: string
}

export type WorkspaceLocOwner = {
  readonly directory: string
  readonly name: string
}

type LocOwnerKind =
  | "app"
  | "config"
  | "infra"
  | "module"
  | "repository"
  | "shared"

export type OwnedLocFile = SccFileRecord & {
  readonly category: LocCategory
  readonly cohort: string
  readonly ownerDirectory: string
  readonly ownerKind: LocOwnerKind
  readonly ownerName: string
}

type LocCategoryMetrics = Readonly<Record<LocCategory, LocMetrics>>

export type DirectoryLocRollup = {
  readonly categories: LocCategoryMetrics
  readonly metrics: LocMetrics
  readonly ownerKind: LocOwnerKind | "mixed"
  readonly ownerName: string
  readonly path: string
}

export type OwnerLocRollup = {
  readonly categories: LocCategoryMetrics
  readonly cohort: string
  readonly cohortMad: number
  readonly cohortMedian: number
  readonly cohortP90: number
  readonly cohortRank: number
  readonly cohortSize: number
  readonly complexityPer100SourceCode: number
  readonly largestSourceFileShare: number
  readonly metrics: LocMetrics
  readonly ownerDirectory: string
  readonly ownerKind: LocOwnerKind
  readonly ownerName: string
  readonly peerMedianRatio: number
  readonly reviewPriority: "normal" | "peer-outlier" | "small-cohort-leader"
}

type MutableMetrics = {
  blanks: number
  bytes: number
  code: number
  comments: number
  complexity: number
  files: number
  lines: number
}

type MutableDirectoryRollup = {
  readonly categories: Record<LocCategory, MutableMetrics>
  readonly metrics: MutableMetrics
  readonly ownerKinds: Set<LocOwnerKind>
  readonly ownerNames: Set<string>
  readonly path: string
}

type MutableOwnerRollup = {
  readonly categories: Record<LocCategory, MutableMetrics>
  readonly cohort: string
  readonly metrics: MutableMetrics
  readonly ownerDirectory: string
  readonly ownerKind: LocOwnerKind
  readonly ownerName: string
  readonly sourceFiles: OwnedLocFile[]
}

const sccHeaders = [
  "Language",
  "Provider",
  "Filename",
  "Lines",
  "Code",
  "Comments",
  "Blanks",
  "Complexity",
  "Bytes",
  "ULOC",
] as const

const generatedPathPatterns = [
  /(?:^|\/)(?:drizzle|migrations?|generated)(?:\/|$)/u,
  /(?:^|\/)(?:build-output\.log)$/u,
  /\.generated\.[^/]+$/u,
] as const
const migrationFilePattern = /(?:^|\/)[^/]*migration[^/]*\.[^/]+$/u

const fixturePathPattern = /(?:^|\/)(?:fixtures?|test-support)(?:\/|$)/u
const testPathPattern =
  /(?:^|\/)(?:__tests__|test|tests)(?:\/|$)|\.(?:spec|test|typecheck)\.[^/]+$/u
const storyPathPattern = /(?:^|\/)stories(?:\/|$)|\.stories\.[^/]+$/u
const documentationPathPattern = /\.(?:md|mdx|txt)$/u
const configurationPathPattern =
  /(?:^|\/)(?:Dockerfile|bun\.lock|package\.json|tsconfig(?:\.[^/]+)?\.json)$|(?:^|\/)\.[^/]*ignore$|(?:^|\/)\.nvmrc$|\.(?:config|setup)\.[^/]+$|\.(?:env|ini|json|jsonc|lock|toml|ya?ml)$/u
const operationsRootPattern = /^(?:\.github|\.vscode|deploy|infra)(?:\/|$)/u

export function normalizeLocPath(filePath: string): string {
  return filePath
    .replaceAll("\\", "/")
    .replace(/^\.\/+/u, "")
    .replace(/\/+/gu, "/")
}

export function parseSccCsv(csv: string): readonly SccFileRecord[] {
  const rows = parseCsvRows(csv)
  const [headers, ...records] = rows

  if (
    headers === undefined ||
    headers.length !== sccHeaders.length ||
    headers.some((header, index) => header !== sccHeaders[index])
  ) {
    throw new Error("지원하지 않는 scc CSV header입니다.")
  }

  const seenPaths = new Set<string>()

  return records.map((record, index) => {
    if (record.length !== sccHeaders.length) {
      throw new Error(`scc CSV ${index + 2}행의 열 수가 올바르지 않습니다.`)
    }

    const filePath = normalizeLocPath(record[1] ?? "")
    if (filePath.length === 0) {
      throw new Error(`scc CSV ${index + 2}행의 경로가 비어 있습니다.`)
    }
    if (seenPaths.has(filePath)) {
      throw new Error(`scc CSV에 중복 경로가 있습니다: ${filePath}`)
    }
    seenPaths.add(filePath)

    return {
      blanks: parseNonNegativeInteger(record[6], "Blanks", index),
      bytes: parseNonNegativeInteger(record[8], "Bytes", index),
      code: parseNonNegativeInteger(record[4], "Code", index),
      comments: parseNonNegativeInteger(record[5], "Comments", index),
      complexity: parseNonNegativeInteger(record[7], "Complexity", index),
      files: 1,
      language: record[0] ?? "",
      lines: parseNonNegativeInteger(record[3], "Lines", index),
      path: filePath,
    }
  })
}

export function classifyLocFile(
  filePath: string,
  language: string
): LocCategory {
  const normalizedPath = normalizeLocPath(filePath)
  const lowerPath = normalizedPath.toLowerCase()
  const lowerLanguage = language.toLowerCase()

  if (
    lowerLanguage.includes("(gen)") ||
    lowerLanguage.includes("(min)") ||
    generatedPathPatterns.some((pattern) => pattern.test(lowerPath))
  ) {
    return "migration/generated"
  }
  if (fixturePathPattern.test(lowerPath)) return "fixture/test-support"
  if (lowerPath.startsWith("e2e/") || testPathPattern.test(lowerPath)) {
    return "test/typecheck"
  }
  if (storyPathPattern.test(lowerPath)) return "story"
  if (
    lowerPath.startsWith("docs/") ||
    lowerPath.startsWith(".agents/") ||
    lowerPath.startsWith(".codex/") ||
    documentationPathPattern.test(lowerPath)
  ) {
    return "docs"
  }
  if (
    operationsRootPattern.test(lowerPath) ||
    configurationPathPattern.test(lowerPath)
  ) {
    return "config/operations"
  }
  if (migrationFilePattern.test(lowerPath)) return "migration/generated"

  return "source"
}

export function assignLocOwners(
  records: readonly SccFileRecord[],
  workspaces: readonly WorkspaceLocOwner[]
): readonly OwnedLocFile[] {
  const orderedWorkspaces = [...workspaces]
    .map((workspace) => ({
      ...workspace,
      directory: normalizeLocPath(workspace.directory),
    }))
    .sort((left, right) => right.directory.length - left.directory.length)

  return records.map((record) => {
    const workspace = orderedWorkspaces.find(
      (candidate) =>
        record.path === candidate.directory ||
        record.path.startsWith(`${candidate.directory}/`)
    )
    const owner =
      workspace === undefined
        ? resolveRepositoryOwner(record.path)
        : resolveWorkspaceOwner(workspace)

    return {
      ...record,
      category: classifyLocFile(record.path, record.language),
      ...owner,
    }
  })
}

export function aggregateLocMetrics(
  records: readonly LocMetrics[]
): LocMetrics {
  const metrics = createMutableMetrics()
  for (const record of records) addMetrics(metrics, record)
  return metrics
}

export function aggregateLocDirectories(
  files: readonly OwnedLocFile[]
): readonly DirectoryLocRollup[] {
  const rollups = new Map<string, MutableDirectoryRollup>()

  for (const file of files) {
    for (const directory of parentDirectories(file.path)) {
      const rollup = rollups.get(directory) ?? createDirectoryRollup(directory)
      addMetrics(rollup.metrics, file)
      addMetrics(rollup.categories[file.category], file)
      rollup.ownerKinds.add(file.ownerKind)
      rollup.ownerNames.add(file.ownerName)
      rollups.set(directory, rollup)
    }
  }

  return [...rollups.values()]
    .map((rollup) => {
      const ownerKind: LocOwnerKind | "mixed" =
        rollup.ownerKinds.size === 1
          ? ([...rollup.ownerKinds][0] ?? "mixed")
          : "mixed"

      return {
        categories: freezeCategoryMetrics(rollup.categories),
        metrics: { ...rollup.metrics },
        ownerKind,
        ownerName:
          rollup.ownerNames.size === 1
            ? ([...rollup.ownerNames][0] ?? "mixed")
            : "mixed",
        path: rollup.path,
      }
    })
    .sort(
      (left, right) =>
        right.metrics.code - left.metrics.code ||
        left.path.localeCompare(right.path)
    )
}

export function aggregateLocOwners(
  files: readonly OwnedLocFile[]
): readonly OwnerLocRollup[] {
  const mutableRollups = new Map<string, MutableOwnerRollup>()

  for (const file of files) {
    const rollup =
      mutableRollups.get(file.ownerDirectory) ?? createOwnerRollup(file)
    addMetrics(rollup.metrics, file)
    addMetrics(rollup.categories[file.category], file)
    if (file.category === "source") rollup.sourceFiles.push(file)
    mutableRollups.set(file.ownerDirectory, rollup)
  }

  const cohorts = new Map<string, MutableOwnerRollup[]>()
  for (const rollup of mutableRollups.values()) {
    const cohort = cohorts.get(rollup.cohort) ?? []
    cohort.push(rollup)
    cohorts.set(rollup.cohort, cohort)
  }
  const cohortStatistics = new Map(
    [...cohorts].map(([cohort, rollups]) => {
      const sourceCode = rollups.map((rollup) => rollup.categories.source.code)
      return [
        cohort,
        {
          mad: medianAbsoluteDeviation(sourceCode),
          median: median(sourceCode),
          p90: quantile(sourceCode, 0.9),
          rankedDirectories: [...rollups]
            .sort(
              (left, right) =>
                right.categories.source.code - left.categories.source.code ||
                left.ownerDirectory.localeCompare(right.ownerDirectory)
            )
            .map((rollup) => rollup.ownerDirectory),
          size: rollups.length,
        },
      ] as const
    })
  )

  return [...mutableRollups.values()]
    .map((rollup) => {
      const statistics = cohortStatistics.get(rollup.cohort)
      if (statistics === undefined) {
        throw new Error(`비교군 통계를 찾지 못했습니다: ${rollup.cohort}`)
      }

      const sourceMetrics = rollup.categories.source
      const largestSourceFileCode = Math.max(
        0,
        ...rollup.sourceFiles.map((file) => file.code)
      )
      const rank =
        statistics.rankedDirectories.indexOf(rollup.ownerDirectory) + 1
      const peerOutlierThreshold = Math.max(
        statistics.p90,
        statistics.median + 2 * statistics.mad
      )
      const reviewPriority =
        statistics.size >= 5 && sourceMetrics.code > peerOutlierThreshold
          ? "peer-outlier"
          : statistics.size < 5 && rank === 1
            ? "small-cohort-leader"
            : "normal"

      return {
        categories: freezeCategoryMetrics(rollup.categories),
        cohort: rollup.cohort,
        cohortMad: statistics.mad,
        cohortMedian: statistics.median,
        cohortP90: statistics.p90,
        cohortRank: rank,
        cohortSize: statistics.size,
        complexityPer100SourceCode:
          sourceMetrics.code === 0
            ? 0
            : (sourceMetrics.complexity / sourceMetrics.code) * 100,
        largestSourceFileShare:
          sourceMetrics.code === 0
            ? 0
            : largestSourceFileCode / sourceMetrics.code,
        metrics: { ...rollup.metrics },
        ownerDirectory: rollup.ownerDirectory,
        ownerKind: rollup.ownerKind,
        ownerName: rollup.ownerName,
        peerMedianRatio:
          statistics.median === 0
            ? sourceMetrics.code === 0
              ? 1
              : Number.POSITIVE_INFINITY
            : sourceMetrics.code / statistics.median,
        reviewPriority,
      } satisfies OwnerLocRollup
    })
    .sort(
      (left, right) =>
        right.categories.source.code - left.categories.source.code ||
        left.ownerDirectory.localeCompare(right.ownerDirectory)
    )
}

export function quantile(
  values: readonly number[],
  probability: number
): number {
  if (values.length === 0) return 0
  if (probability < 0 || probability > 1) {
    throw new Error("quantile probability는 0 이상 1 이하여야 합니다.")
  }

  const sorted = [...values].sort((left, right) => left - right)
  const position = (sorted.length - 1) * probability
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)
  const lower = sorted[lowerIndex] ?? 0
  const upper = sorted[upperIndex] ?? lower
  return lower + (upper - lower) * (position - lowerIndex)
}

export function medianAbsoluteDeviation(values: readonly number[]): number {
  if (values.length === 0) return 0
  const center = median(values)
  return median(values.map((value) => Math.abs(value - center)))
}

export function serializeCsv(
  rows: readonly (readonly (boolean | number | string)[])[]
): string {
  return `${rows
    .map((row) => row.map((value) => escapeCsvValue(String(value))).join(","))
    .join("\n")}\n`
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = []
  let field = ""
  let inQuotes = false
  let row: string[] = []

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index] ?? ""

    if (inQuotes) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        inQuotes = false
      } else {
        field += character
      }
      continue
    }

    if (character === '"' && field.length === 0) {
      inQuotes = true
    } else if (character === ",") {
      row.push(field)
      field = ""
    } else if (character === "\n") {
      row.push(field.replace(/\r$/u, ""))
      if (row.some((value) => value.length > 0)) rows.push(row)
      row = []
      field = ""
    } else {
      field += character
    }
  }

  if (inQuotes) throw new Error("종료되지 않은 CSV quoted field가 있습니다.")
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/u, ""))
    rows.push(row)
  }

  return rows
}

function parseNonNegativeInteger(
  value: string | undefined,
  field: string,
  recordIndex: number
): number {
  if (value === undefined || !/^\d+$/u.test(value)) {
    throw new Error(
      `scc CSV ${recordIndex + 2}행 ${field} 값이 정수가 아닙니다.`
    )
  }
  return Number(value)
}

function resolveWorkspaceOwner(workspace: WorkspaceLocOwner): {
  readonly cohort: string
  readonly ownerDirectory: string
  readonly ownerKind: LocOwnerKind
  readonly ownerName: string
} {
  const ownerKind = workspaceKind(workspace.directory)
  return {
    cohort: ownerKind,
    ownerDirectory: workspace.directory,
    ownerKind,
    ownerName: workspace.name,
  }
}

function workspaceKind(directory: string): Exclude<LocOwnerKind, "repository"> {
  if (directory.startsWith("apps/")) return "app"
  if (directory.startsWith("packages/modules/")) return "module"
  if (directory.startsWith("packages/infra/")) return "infra"
  if (directory.startsWith("packages/shared/")) return "shared"
  if (directory.startsWith("packages/config/")) return "config"
  throw new Error(`지원하지 않는 workspace 경로입니다: ${directory}`)
}

function resolveRepositoryOwner(filePath: string): {
  readonly cohort: string
  readonly ownerDirectory: string
  readonly ownerKind: "repository"
  readonly ownerName: string
} {
  const [topLevel] = filePath.split("/")
  const ownerDirectory = filePath.includes("/") ? (topLevel ?? ".") : "."

  return {
    cohort: repositoryCohort(ownerDirectory),
    ownerDirectory,
    ownerKind: "repository",
    ownerName: ownerDirectory,
  }
}

function repositoryCohort(ownerDirectory: string): string {
  if (ownerDirectory === "scripts") return "repository-tooling"
  if (ownerDirectory === "e2e") return "repository-test"
  if (
    ownerDirectory === "infra" ||
    ownerDirectory === "deploy" ||
    ownerDirectory === ".github"
  ) {
    return "repository-operations"
  }
  if (ownerDirectory === "docs") return "repository-documentation"
  if (ownerDirectory === ".agents" || ownerDirectory === ".codex") {
    return "repository-agent-tooling"
  }
  return "repository-config"
}

function parentDirectories(filePath: string): readonly string[] {
  const segments = normalizeLocPath(filePath).split("/")
  const directories = ["."]
  for (let index = 1; index < segments.length; index += 1) {
    directories.push(segments.slice(0, index).join("/"))
  }
  return directories
}

function createMutableMetrics(): MutableMetrics {
  return {
    blanks: 0,
    bytes: 0,
    code: 0,
    comments: 0,
    complexity: 0,
    files: 0,
    lines: 0,
  }
}

function createCategoryMetrics(): Record<LocCategory, MutableMetrics> {
  return Object.fromEntries(
    locCategories.map((category) => [category, createMutableMetrics()])
  ) as Record<LocCategory, MutableMetrics>
}

function addMetrics(target: MutableMetrics, source: LocMetrics): void {
  target.blanks += source.blanks
  target.bytes += source.bytes
  target.code += source.code
  target.comments += source.comments
  target.complexity += source.complexity
  target.files += source.files
  target.lines += source.lines
}

function createDirectoryRollup(path: string): MutableDirectoryRollup {
  return {
    categories: createCategoryMetrics(),
    metrics: createMutableMetrics(),
    ownerKinds: new Set(),
    ownerNames: new Set(),
    path,
  }
}

function createOwnerRollup(file: OwnedLocFile): MutableOwnerRollup {
  return {
    categories: createCategoryMetrics(),
    cohort: file.cohort,
    metrics: createMutableMetrics(),
    ownerDirectory: file.ownerDirectory,
    ownerKind: file.ownerKind,
    ownerName: file.ownerName,
    sourceFiles: [],
  }
}

function freezeCategoryMetrics(
  categories: Record<LocCategory, MutableMetrics>
): LocCategoryMetrics {
  return Object.fromEntries(
    locCategories.map((category) => [category, { ...categories[category] }])
  ) as LocCategoryMetrics
}

function median(values: readonly number[]): number {
  return quantile(values, 0.5)
}

function escapeCsvValue(value: string): string {
  return /[",\r\n]/u.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}
