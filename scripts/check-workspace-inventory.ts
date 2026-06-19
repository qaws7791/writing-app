import fs from "node:fs"
import path from "node:path"

type JsonRecord = Record<string, unknown>

type WorkspaceEntry = {
  readonly directory: string
  readonly hasVitestConfig: boolean
  readonly name: string
}

const workspaceInventoryDocumentPath = "docs/engineering/workspace-inventory.md"
const requiredAnalysisRoots = [
  "apps/storybook/**",
  "packages/config/**",
  "scripts/**",
] as const
const requiredTurboTasks = [
  "build",
  "dev",
  "lint",
  "test",
  "typecheck",
] as const
const requiredTurboBuildOutputs = [
  "dist/**",
  ".next/**",
  "!.next/cache/**",
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

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll(path.sep, "/")
}

function discoverWorkspaceEntries(): WorkspaceEntry[] {
  const rootPackageJson = readJsonFile(
    path.join(repositoryRoot, "package.json")
  )
  const workspaceGlobs = readStringArray(rootPackageJson["workspaces"])
  const directories = workspaceGlobs.flatMap(expandWorkspaceGlob)

  return directories
    .map((directory) => {
      const manifestPath = path.join(repositoryRoot, directory, "package.json")
      const manifest = readJsonFile(manifestPath)
      const packageName = manifest["name"]

      if (typeof packageName !== "string" || packageName.length === 0) {
        failures.push(`${directory}/package.json must declare a package name.`)
      }

      return {
        directory,
        hasVitestConfig: fs.existsSync(
          path.join(repositoryRoot, directory, "vitest.config.ts")
        ),
        name: typeof packageName === "string" ? packageName : "",
      }
    })
    .sort((left, right) => left.directory.localeCompare(right.directory))
}

function expandWorkspaceGlob(workspaceGlob: string): string[] {
  if (!workspaceGlob.endsWith("/*")) {
    failures.push(`Unsupported workspace glob: ${workspaceGlob}`)
    return []
  }

  const rootDirectory = workspaceGlob.slice(0, -2)
  const absoluteRootDirectory = path.join(repositoryRoot, rootDirectory)

  if (!fs.existsSync(absoluteRootDirectory)) {
    failures.push(`Workspace root does not exist: ${rootDirectory}`)
    return []
  }

  return fs
    .readdirSync(absoluteRootDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => normalizePath(path.join(rootDirectory, entry.name)))
    .filter((directory) =>
      fs.existsSync(path.join(repositoryRoot, directory, "package.json"))
    )
}

function readVitestWorkspaceProjects(): string[] {
  const content = fs.readFileSync(
    path.join(repositoryRoot, "vitest.workspace.ts"),
    "utf8"
  )
  const projectPattern = /"([^"]+\/vitest\.config\.ts)"/g

  return [...content.matchAll(projectPattern)]
    .map((match) => match[1] ?? "")
    .filter(Boolean)
    .sort()
}

function reportMissingOrExtra({
  actual,
  expected,
  label,
}: {
  readonly actual: readonly string[]
  readonly expected: readonly string[]
  readonly label: string
}) {
  const actualSet = new Set(actual)
  const expectedSet = new Set(expected)
  const missing = expected.filter((item) => !actualSet.has(item))
  const extra = actual.filter((item) => !expectedSet.has(item))

  for (const item of missing) {
    failures.push(`${label} is missing ${item}.`)
  }

  for (const item of extra) {
    failures.push(`${label} has stale entry ${item}.`)
  }
}

function validateVitestWorkspace(workspaceEntries: readonly WorkspaceEntry[]) {
  const expectedProjects = workspaceEntries
    .filter((entry) => entry.hasVitestConfig)
    .map((entry) => `${entry.directory}/vitest.config.ts`)
    .sort()
  const actualProjects = readVitestWorkspaceProjects()

  reportMissingOrExtra({
    actual: actualProjects,
    expected: expectedProjects,
    label: "vitest.workspace.ts",
  })
}

function validateRootPackageScripts() {
  const rootPackageJson = readJsonFile(
    path.join(repositoryRoot, "package.json")
  )
  const scripts = rootPackageJson["scripts"]

  if (!isRecord(scripts)) {
    failures.push("package.json must declare scripts.")
    return
  }

  const lintScript = scripts["lint"]
  if (
    typeof lintScript !== "string" ||
    !lintScript.includes("check:workspace-inventory")
  ) {
    failures.push("package.json lint must run check:workspace-inventory.")
  }

  const coverageScript = scripts["test:coverage"]
  if (
    typeof coverageScript !== "string" ||
    !coverageScript.includes("vitest.workspace.ts")
  ) {
    failures.push("package.json test:coverage must use vitest.workspace.ts.")
  }

  const analysisScript = scripts["repomix:analysis"]
  if (typeof analysisScript !== "string") {
    failures.push("package.json must declare repomix:analysis.")
    return
  }

  for (const root of requiredAnalysisRoots) {
    if (!analysisScript.includes(root)) {
      failures.push(`repomix:analysis must include ${root}.`)
    }
  }
}

function validateTurboTasks() {
  const turboJson = readJsonFile(path.join(repositoryRoot, "turbo.json"))
  const tasks = turboJson["tasks"]

  if (!isRecord(tasks)) {
    failures.push("turbo.json must declare tasks.")
    return
  }

  for (const taskName of requiredTurboTasks) {
    if (!isRecord(tasks[taskName])) {
      failures.push(`turbo.json tasks must include ${taskName}.`)
    }
  }

  const buildTask = tasks["build"]
  if (!isRecord(buildTask)) {
    return
  }

  const outputs = readStringArray(buildTask["outputs"])

  for (const output of requiredTurboBuildOutputs) {
    if (!outputs.includes(output)) {
      failures.push(`turbo.json build outputs must include ${output}.`)
    }
  }
}

function validateWorkspaceInventoryDocument(
  workspaceEntries: readonly WorkspaceEntry[]
) {
  const content = fs.readFileSync(
    path.join(repositoryRoot, workspaceInventoryDocumentPath),
    "utf8"
  )
  const rows = readMarkdownTableRows(content)

  for (const entry of workspaceEntries) {
    const hasWorkspaceRow = rows.some(
      ([directory, name]) =>
        directory === toMarkdownCode(entry.directory) &&
        name === toMarkdownCode(entry.name)
    )

    if (!hasWorkspaceRow) {
      failures.push(
        `${workspaceInventoryDocumentPath} must include ${entry.directory} (${entry.name}).`
      )
    }
  }

  if (!rows.some(([directory]) => directory === toMarkdownCode("scripts"))) {
    failures.push(`${workspaceInventoryDocumentPath} must include scripts.`)
  }
}

function readMarkdownTableRows(content: string): string[][] {
  return content
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("|"))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim())
    )
}

function toMarkdownCode(value: string): string {
  return `\`${value}\``
}

const workspaceEntries = discoverWorkspaceEntries()

validateVitestWorkspace(workspaceEntries)
validateRootPackageScripts()
validateTurboTasks()
validateWorkspaceInventoryDocument(workspaceEntries)

if (failures.length > 0) {
  console.error("Workspace inventory check failed.")

  for (const failure of failures) {
    console.error(`- ${failure}`)
  }

  process.exit(1)
}

console.log(
  `Workspace inventory is in sync across ${workspaceEntries.length} workspaces.`
)
