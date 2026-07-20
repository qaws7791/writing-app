import fs from "node:fs"
import path from "node:path"

import {
  createRepositoryWorkspaceInventory,
  formatWorkspaceInventoryError,
} from "@workspace/repository-tooling"

type JsonRecord = Record<string, unknown>

type WorkspacePackage = {
  readonly exports: readonly string[]
  readonly scripts: ReadonlySet<string>
}

const markdownRoots = [
  "README.md",
  "docs/_index.md",
  "docs/authority-map.md",
  "docs/glossary.md",
  "docs/design",
  "docs/engineering",
  "docs/product",
] as const

const historicalOrAnalysisDocumentPatterns = [
  /^docs\/engineering\/adr\//u,
  /^docs\/archive\//u,
  /^docs\/work\//u,
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

const repositoryRoot = process.cwd()
const failures: string[] = []

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readJsonFile(filePath: string): JsonRecord {
  const value: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"))

  if (!isRecord(value)) {
    throw new Error(`${filePath} must contain a JSON object.`)
  }

  return value
}

function readScripts(value: unknown): ReadonlySet<string> {
  return isRecord(value) ? new Set(Object.keys(value)) : new Set()
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

function collectFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath]
  })
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
        exports: workspace.exportEntries.map(({ key }) => key),
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

  for (const filePath of markdownFiles) {
    if (isHistoricalOrAnalysisDocumentPath(filePath)) {
      continue
    }

    const content = fs.readFileSync(path.join(repositoryRoot, filePath), "utf8")

    for (const command of content.matchAll(/\bbun run ([\w:.-]+)/g)) {
      const scriptName = command[1] ?? ""

      if (!scriptName.startsWith("--") && !rootScripts.has(scriptName)) {
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

      if (workspacePackage === undefined) {
        failures.push(`${filePath} references missing package ${packageName}.`)
      } else if (!workspacePackage.scripts.has(scriptName)) {
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

      const [, packageSegment = "", subpath = ""] =
        specifier.match(/^(@workspace\/[a-z0-9-]+)(?:\/(.+))?$/) ?? []
      const workspacePackage = packages.get(packageSegment)

      if (workspacePackage === undefined) {
        failures.push(
          `${filePath} references missing package ${packageSegment}.`
        )
        continue
      }

      if (
        subpath.length > 0 &&
        !workspacePackage.exports.some((candidate) =>
          candidate.endsWith("*")
            ? `./${subpath}`.startsWith(candidate.slice(0, -1))
            : candidate === `./${subpath}`
        )
      ) {
        failures.push(`${filePath} references missing export ${specifier}.`)
      }
    }
  }
}

function validateMarkdownLinks(markdownFiles: readonly string[]) {
  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(path.join(repositoryRoot, filePath), "utf8")

    for (const match of content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      const rawTarget = match[1]?.trim() ?? ""
      const target = rawTarget.replace(/^<|>$/g, "").split(/[?#]/, 1)[0] ?? ""

      if (
        target.length === 0 ||
        target.startsWith("http:") ||
        target.startsWith("https:") ||
        target.startsWith("mailto:")
      ) {
        continue
      }

      const absoluteTarget = path.resolve(
        repositoryRoot,
        path.dirname(filePath),
        target
      )
      if (!fs.existsSync(absoluteTarget)) {
        failures.push(`${filePath} references missing local link ${rawTarget}.`)
      }
    }
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

export function isValidTaskDocumentDirectoryName(name: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*$/u.exec(name)
  if (match === null) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function validateKnowledgeDocumentStructure() {
  const allowedRootMarkdown = new Set(["AGENTS.md", "README.md"])
  const rootMarkdown = fs
    .readdirSync(repositoryRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)

  for (const fileName of rootMarkdown) {
    if (!allowedRootMarkdown.has(fileName)) {
      failures.push(
        `repository root에 허용되지 않은 Markdown이 있습니다: ${fileName}.`
      )
    }
  }

  for (const category of ["work", "archive"] as const) {
    const directory = path.join(repositoryRoot, "docs", category)
    if (!fs.existsSync(directory)) continue

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (
        entry.isDirectory() &&
        !isValidTaskDocumentDirectoryName(entry.name)
      ) {
        failures.push(
          `docs/${category}/${entry.name} 작업 디렉터리는 yyyy-mm-dd-kebab-case 형식이어야 합니다.`
        )
      }
    }
  }
}

function main() {
  const markdownFiles = collectMarkdownFiles()
  const packages = readWorkspacePackages()

  validateDocumentedCommands(markdownFiles, packages)
  validateDocumentedWorkspaceImports(markdownFiles, packages)
  validateMarkdownLinks(markdownFiles)
  validateCurrentResourceLibraryDocumentation(markdownFiles)
  validateKnowledgeDocumentStructure()

  if (failures.length > 0) {
    console.error("Document drift check failed.")

    for (const failure of failures) {
      console.error(`- ${failure}`)
    }

    process.exit(1)
  }

  console.log("Document structure and reference checks passed.")
}

if (import.meta.main) {
  main()
}
