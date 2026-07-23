import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"

import {
  aggregateLocDirectories,
  aggregateLocMetrics,
  aggregateLocOwners,
  assignLocOwners,
  locCategories,
  normalizeLocPath,
  parseSccCsv,
  serializeCsv,
  type LocMetrics,
  type OwnedLocFile,
  type OwnerLocRollup,
} from "#scripts/loc-analysis"
import {
  createWorkspaceInventory,
  formatWorkspaceInventoryError,
} from "#scripts/workspace-inventory"

const requiredSccVersion = "3.7.0"
const sccArguments = [
  "--by-file",
  "--format",
  "csv",
  "--no-cocomo",
  "--gen",
  "--min",
  "--sort",
  "code",
  ".",
] as const

type AnalysisOptions = {
  readonly outputRoot: string
  readonly repositoryRoot: string
  readonly sccBinary: string
}

type AnalysisMetadata = {
  readonly command: readonly string[]
  readonly commit: string
  readonly countedFiles: number
  readonly executedAt: string
  readonly outputDirectory: string
  readonly platform: string
  readonly repositoryRoot: string
  readonly sccBinary: string
  readonly sccBinarySha256: string
  readonly sccVersion: string
  readonly trackedFiles: number
  readonly uncountedFiles: number
}

function main(): void {
  const options = parseOptions(process.argv.slice(2))
  assertCleanRepository(options.repositoryRoot)

  const commit = runTextCommand("git", [
    "-C",
    options.repositoryRoot,
    "rev-parse",
    "HEAD",
  ]).trim()
  const sccBinary = resolveExecutable(options.sccBinary)
  const sccVersionOutput = runTextCommand(sccBinary, ["--version"]).trim()
  const sccVersion = /^scc version (\d+\.\d+\.\d+)$/u.exec(
    sccVersionOutput
  )?.[1]

  if (sccVersion !== requiredSccVersion) {
    throw new Error(
      `scc ${requiredSccVersion}이 필요하지만 ${sccVersionOutput || "버전을 확인할 수 없는 실행 파일"}이 제공됐습니다.`
    )
  }

  const workspaceResult = createWorkspaceInventory(options.repositoryRoot)
  if (workspaceResult.status === "failure") {
    throw new Error(
      workspaceResult.errors.map(formatWorkspaceInventoryError).join("\n")
    )
  }

  const trackedFiles = readTrackedFiles(options.repositoryRoot)
  const rawSccCsv = runTextCommand(sccBinary, sccArguments, {
    cwd: options.repositoryRoot,
    maxBuffer: 128 * 1024 * 1024,
  })
  const sccRecords = parseSccCsv(rawSccCsv)
  const trackedFileSet = new Set(trackedFiles)
  const sccOnlyFiles = sccRecords
    .map((record) => record.path)
    .filter((filePath) => !trackedFileSet.has(filePath))

  if (sccOnlyFiles.length > 0) {
    throw new Error(
      `scc 결과에 Git 추적 대상이 아닌 파일이 있습니다:\n${sccOnlyFiles
        .slice(0, 20)
        .map((filePath) => `- ${filePath}`)
        .join("\n")}`
    )
  }

  const files = assignLocOwners(
    sccRecords,
    workspaceResult.inventory.allWorkspaces
  )
  const directories = aggregateLocDirectories(files)
  const owners = aggregateLocOwners(files)
  const total = aggregateLocMetrics(files)
  const rootDirectory = directories.find((directory) => directory.path === ".")

  if (rootDirectory === undefined) {
    throw new Error("repository root LOC 집계를 만들지 못했습니다.")
  }

  assertEqualMetrics("file과 root directory", total, rootDirectory.metrics)
  assertEqualMetrics(
    "file과 owner",
    total,
    aggregateLocMetrics(owners.map((owner) => owner.metrics))
  )
  assertEqualMetrics(
    "전체와 category",
    total,
    aggregateLocMetrics(
      locCategories.map((category) => rootDirectory.categories[category])
    )
  )

  const countedPaths = new Set(files.map((file) => file.path))
  const outputDirectory = path.resolve(options.outputRoot, commit)
  const metadata: AnalysisMetadata = {
    command: [sccBinary, ...sccArguments],
    commit,
    countedFiles: files.length,
    executedAt: new Date().toISOString(),
    outputDirectory: normalizeLocPath(outputDirectory),
    platform: `${process.platform}-${process.arch}`,
    repositoryRoot: normalizeLocPath(options.repositoryRoot),
    sccBinary: normalizeLocPath(sccBinary),
    sccBinarySha256: sha256File(sccBinary),
    sccVersion,
    trackedFiles: trackedFiles.length,
    uncountedFiles: trackedFiles.length - countedPaths.size,
  }

  fs.mkdirSync(outputDirectory, { recursive: true })
  fs.writeFileSync(path.join(outputDirectory, "scc-files.csv"), rawSccCsv)
  writeJson(path.join(outputDirectory, "metadata.json"), metadata)
  writeJson(path.join(outputDirectory, "summary.json"), {
    directories,
    metadata,
    owners,
    total,
  })
  fs.writeFileSync(
    path.join(outputDirectory, "owners.csv"),
    ownersCsv(owners, total)
  )
  fs.writeFileSync(
    path.join(outputDirectory, "directories.csv"),
    directoriesCsv(directories, total)
  )
  fs.writeFileSync(path.join(outputDirectory, "files.csv"), filesCsv(files))
  fs.writeFileSync(
    path.join(outputDirectory, "inventory.csv"),
    inventoryCsv(trackedFiles, files)
  )
  fs.writeFileSync(
    path.join(outputDirectory, "summary.md"),
    markdownSummary({ files, metadata, owners, total })
  )

  console.log(`LOC 분석을 생성했습니다: ${outputDirectory}`)
  console.log(
    `Git 추적 ${metadata.trackedFiles}개, scc 집계 ${metadata.countedFiles}개, 미집계 ${metadata.uncountedFiles}개`
  )
  console.log(
    `전체 ${total.code.toLocaleString("en-US")} CLOC, source ${owners
      .reduce((sum, owner) => sum + owner.categories.source.code, 0)
      .toLocaleString("en-US")} CLOC`
  )
}

function parseOptions(arguments_: readonly string[]): AnalysisOptions {
  let outputRoot: string | undefined
  let repositoryRoot: string | undefined
  let sccBinary = "scc"

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]
    const value = arguments_[index + 1]

    if (
      argument !== "--output-root" &&
      argument !== "--repository-root" &&
      argument !== "--scc-binary"
    ) {
      throw new Error(`지원하지 않는 인자입니다: ${argument ?? ""}`)
    }
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`${argument} 값을 지정해야 합니다.`)
    }

    if (argument === "--output-root") outputRoot = value
    if (argument === "--repository-root") repositoryRoot = value
    if (argument === "--scc-binary") sccBinary = value
    index += 1
  }

  const resolvedRepositoryRoot = path.resolve(repositoryRoot ?? process.cwd())
  return {
    outputRoot: path.resolve(
      outputRoot ?? path.join(resolvedRepositoryRoot, "output", "loc-analysis")
    ),
    repositoryRoot: resolvedRepositoryRoot,
    sccBinary,
  }
}

function assertCleanRepository(repositoryRoot: string): void {
  const status = runTextCommand("git", [
    "-C",
    repositoryRoot,
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]).trim()

  if (status.length > 0) {
    throw new Error(
      `재현 가능한 LOC 측정을 위해 clean checkout이 필요합니다:\n${status}`
    )
  }
}

function resolveExecutable(binary: string): string {
  const hasDirectory = path.isAbsolute(binary) || /[\\/]/u.test(binary)

  if (hasDirectory) {
    const resolved = path.resolve(binary)
    if (!fs.existsSync(resolved)) {
      throw new Error(`scc 실행 파일을 찾을 수 없습니다: ${resolved}`)
    }
    return resolved
  }

  const lookupCommand = process.platform === "win32" ? "where.exe" : "which"
  const lookup = spawnSync(lookupCommand, [binary], {
    encoding: "utf8",
    windowsHide: true,
  })
  const located = lookup.stdout
    ?.split(/\r?\n/u)
    .find((candidate) => candidate.trim().length > 0)

  if (
    lookup.error !== undefined ||
    lookup.status !== 0 ||
    located === undefined
  ) {
    throw new Error(
      "scc를 찾을 수 없습니다. 공식 v3.7.0을 설치하거나 --scc-binary를 지정하세요."
    )
  }
  return path.resolve(located.trim())
}

function readTrackedFiles(repositoryRoot: string): readonly string[] {
  return runTextCommand("git", ["-C", repositoryRoot, "ls-files", "-z"], {
    maxBuffer: 64 * 1024 * 1024,
  })
    .split("\0")
    .filter((filePath) => filePath.length > 0)
    .map(normalizeLocPath)
    .sort()
}

function runTextCommand(
  command: string,
  arguments_: readonly string[],
  options: {
    readonly cwd?: string
    readonly maxBuffer?: number
  } = {}
): string {
  const result = spawnSync(command, arguments_, {
    cwd: options.cwd,
    encoding: "utf8",
    maxBuffer: options.maxBuffer ?? 16 * 1024 * 1024,
    windowsHide: true,
  })

  if (result.error !== undefined) throw result.error
  if (result.status !== 0) {
    throw new Error(
      [
        `${command} 실행이 종료 코드 ${result.status ?? "unknown"}로 실패했습니다.`,
        result.stderr.trim(),
      ]
        .filter((message) => message.length > 0)
        .join("\n")
    )
  }
  return result.stdout
}

function assertEqualMetrics(
  label: string,
  expected: LocMetrics,
  actual: LocMetrics
): void {
  for (const key of [
    "blanks",
    "bytes",
    "code",
    "comments",
    "complexity",
    "files",
    "lines",
  ] as const) {
    if (expected[key] !== actual[key]) {
      throw new Error(
        `${label} ${key} 합계가 다릅니다: ${expected[key]} != ${actual[key]}`
      )
    }
  }
}

function ownersCsv(
  owners: readonly OwnerLocRollup[],
  total: LocMetrics
): string {
  return serializeCsv([
    [
      "Owner",
      "Name",
      "Kind",
      "Cohort",
      "Files",
      "Lines",
      "Code",
      "SourceCode",
      "TestCode",
      "FixtureCode",
      "StoryCode",
      "MigrationGeneratedCode",
      "DocsCode",
      "ConfigOperationsCode",
      "RepositoryCodePercent",
      "CohortRank",
      "CohortSize",
      "CohortMedianSourceCode",
      "CohortP90SourceCode",
      "CohortMadSourceCode",
      "PeerMedianRatio",
      "ComplexityPer100SourceCode",
      "LargestSourceFilePercent",
      "ReviewPriority",
    ],
    ...owners.map((owner) => [
      owner.ownerDirectory,
      owner.ownerName,
      owner.ownerKind,
      owner.cohort,
      owner.metrics.files,
      owner.metrics.lines,
      owner.metrics.code,
      owner.categories.source.code,
      owner.categories["test/typecheck"].code,
      owner.categories["fixture/test-support"].code,
      owner.categories.story.code,
      owner.categories["migration/generated"].code,
      owner.categories.docs.code,
      owner.categories["config/operations"].code,
      percentage(owner.metrics.code, total.code),
      owner.cohortRank,
      owner.cohortSize,
      round(owner.cohortMedian),
      round(owner.cohortP90),
      round(owner.cohortMad),
      formatRatio(owner.peerMedianRatio),
      round(owner.complexityPer100SourceCode),
      round(owner.largestSourceFileShare * 100),
      owner.reviewPriority,
    ]),
  ])
}

function directoriesCsv(
  directories: ReturnType<typeof aggregateLocDirectories>,
  total: LocMetrics
): string {
  return serializeCsv([
    [
      "Directory",
      "Owner",
      "OwnerKind",
      "Files",
      "Lines",
      "Code",
      "SourceCode",
      "TestCode",
      "FixtureCode",
      "StoryCode",
      "MigrationGeneratedCode",
      "DocsCode",
      "ConfigOperationsCode",
      "RepositoryCodePercent",
      "Complexity",
      "Bytes",
    ],
    ...directories.map((directory) => [
      directory.path,
      directory.ownerName,
      directory.ownerKind,
      directory.metrics.files,
      directory.metrics.lines,
      directory.metrics.code,
      directory.categories.source.code,
      directory.categories["test/typecheck"].code,
      directory.categories["fixture/test-support"].code,
      directory.categories.story.code,
      directory.categories["migration/generated"].code,
      directory.categories.docs.code,
      directory.categories["config/operations"].code,
      percentage(directory.metrics.code, total.code),
      directory.metrics.complexity,
      directory.metrics.bytes,
    ]),
  ])
}

function filesCsv(files: readonly OwnedLocFile[]): string {
  return serializeCsv([
    [
      "Path",
      "Owner",
      "OwnerKind",
      "Category",
      "Language",
      "Lines",
      "Code",
      "Comments",
      "Blanks",
      "Complexity",
      "Bytes",
    ],
    ...[...files]
      .sort(
        (left, right) =>
          right.code - left.code || left.path.localeCompare(right.path)
      )
      .map((file) => [
        file.path,
        file.ownerName,
        file.ownerKind,
        file.category,
        file.language,
        file.lines,
        file.code,
        file.comments,
        file.blanks,
        file.complexity,
        file.bytes,
      ]),
  ])
}

function inventoryCsv(
  trackedFiles: readonly string[],
  files: readonly OwnedLocFile[]
): string {
  const filesByPath = new Map(files.map((file) => [file.path, file]))

  return serializeCsv([
    ["Path", "Status", "Owner", "Category", "Language"],
    ...trackedFiles.map((filePath) => {
      const file = filesByPath.get(filePath)
      return file === undefined
        ? [filePath, "not-counted", "", "", ""]
        : [
            filePath,
            "scc-counted",
            file.ownerName,
            file.category,
            file.language,
          ]
    }),
  ])
}

function markdownSummary({
  files,
  metadata,
  owners,
  total,
}: {
  readonly files: readonly OwnedLocFile[]
  readonly metadata: AnalysisMetadata
  readonly owners: readonly OwnerLocRollup[]
  readonly total: LocMetrics
}): string {
  const sourceCode = owners.reduce(
    (sum, owner) => sum + owner.categories.source.code,
    0
  )
  const largestFiles = [...files]
    .filter((file) => file.category === "source")
    .sort(
      (left, right) =>
        right.code - left.code || left.path.localeCompare(right.path)
    )
    .slice(0, 20)

  return `# LOC 분석 요약

- commit: \`${metadata.commit}\`
- 실행 시각: \`${metadata.executedAt}\`
- scc: \`${metadata.sccVersion}\` (\`${metadata.sccBinarySha256}\`)
- Git 추적 파일: ${metadata.trackedFiles.toLocaleString("en-US")}개
- scc 집계 파일: ${metadata.countedFiles.toLocaleString("en-US")}개
- 미집계 파일: ${metadata.uncountedFiles.toLocaleString("en-US")}개
- 전체 CLOC: ${total.code.toLocaleString("en-US")}
- source CLOC: ${sourceCode.toLocaleString("en-US")}

## 소유 경계

| 소유 경계 | 비교군 | source CLOC | test CLOC | 전체 CLOC | 중앙값 배수 | 검토 우선순위 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
${owners
  .map(
    (owner) =>
      `| \`${owner.ownerDirectory}\` | ${owner.cohort} | ${owner.categories.source.code.toLocaleString("en-US")} | ${owner.categories["test/typecheck"].code.toLocaleString("en-US")} | ${owner.metrics.code.toLocaleString("en-US")} | ${formatRatio(owner.peerMedianRatio)} | ${owner.reviewPriority} |`
  )
  .join("\n")}

## 큰 source 파일

| 파일 | 소유 경계 | CLOC | complexity |
| --- | --- | ---: | ---: |
${largestFiles
  .map(
    (file) =>
      `| \`${file.path}\` | ${file.ownerName} | ${file.code.toLocaleString("en-US")} | ${file.complexity.toLocaleString("en-US")} |`
  )
  .join("\n")}
`
}

function percentage(value: number, total: number): number {
  return total === 0 ? 0 : round((value / total) * 100)
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function formatRatio(value: number): number | string {
  return Number.isFinite(value) ? round(value) : "N/A"
}

function sha256File(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex")
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

if (import.meta.main) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
