import fs from "node:fs"
import path from "node:path"

import {
  createRepositoryWorkspaceInventory,
  formatWorkspaceInventoryError,
  type WorkspaceInventory,
} from "@workspace/repository-tooling"

type JsonRecord = Record<string, unknown>

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

function validateVitestWorkspace(inventory: WorkspaceInventory) {
  for (const workspace of inventory.testCapableWorkspaces) {
    if (!workspace.hasVitestConfig) {
      failures.push(
        `${workspace.directory} has a test script but no vitest.config.ts.`
      )
    }
  }

  for (const workspace of inventory.allWorkspaces) {
    if (workspace.hasVitestConfig && workspace.testRuntime === null) {
      failures.push(
        `${workspace.directory} has vitest.config.ts but no supported test script.`
      )
    }
  }

  const expectedProjects = inventory.testCapableWorkspaces
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
    !coverageScript.includes("run-workspace-coverage.ts")
  ) {
    failures.push(
      "package.json test:coverage must use run-workspace-coverage.ts."
    )
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

function validatePackageExports(
  workspaceEntries: readonly WorkspaceManifest[]
) {
  for (const entry of workspaceEntries) {
    const packageDirectory = path.join(repositoryRoot, entry.directory)
    const exportsValue = entry.exportsValue

    if (exportsValue === undefined) {
      continue
    }

    if (!isRecord(exportsValue)) {
      failures.push(
        `${entry.directory}/package.json exports must be an object.`
      )
      continue
    }

    for (const [exportKey, exportValue] of Object.entries(exportsValue)) {
      validateExportKey(entry.directory, exportKey)
      validateExportValue({
        conditionPath: exportKey,
        exportKey,
        packageDirectory,
        value: exportValue,
      })
    }
  }
}

function validateExportKey(packageDirectory: string, exportKey: string) {
  if (!exportKey.startsWith(".")) {
    failures.push(
      `${packageDirectory}/package.json export key ${exportKey} must start with ".".`
    )
  }

  if (exportKey === "./src" || exportKey.startsWith("./src/")) {
    failures.push(
      `${packageDirectory}/package.json must not expose source-internal export key ${exportKey}.`
    )
  }
}

function validateExportValue({
  conditionPath,
  exportKey,
  packageDirectory,
  value,
}: {
  readonly conditionPath: string
  readonly exportKey: string
  readonly packageDirectory: string
  readonly value: unknown
}) {
  if (typeof value === "string") {
    validateExportTarget({
      exportKey,
      packageDirectory,
      target: value,
    })
    return
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      failures.push(
        `${packageDirectory}/package.json export ${conditionPath} must not be empty.`
      )
    }

    for (const [index, item] of value.entries()) {
      validateExportValue({
        conditionPath: `${conditionPath}[${index}]`,
        exportKey,
        packageDirectory,
        value: item,
      })
    }
    return
  }

  if (isRecord(value)) {
    const entries = Object.entries(value)

    if (entries.length === 0) {
      failures.push(
        `${packageDirectory}/package.json export ${conditionPath} must not be empty.`
      )
    }

    for (const [condition, target] of entries) {
      validateExportValue({
        conditionPath: `${conditionPath}.${condition}`,
        exportKey,
        packageDirectory,
        value: target,
      })
    }
    return
  }

  failures.push(
    `${packageDirectory}/package.json export ${conditionPath} must resolve to a string target.`
  )
}

function validateExportTarget({
  exportKey,
  packageDirectory,
  target,
}: {
  readonly exportKey: string
  readonly packageDirectory: string
  readonly target: string
}) {
  if (!target.startsWith("./")) {
    failures.push(
      `${packageDirectory}/package.json export ${exportKey} target ${target} must be package-relative.`
    )
    return
  }

  const absolutePackageDirectory = path.resolve(packageDirectory)
  const absoluteTarget = path.resolve(packageDirectory, target)

  if (!isPathInsideDirectory(absoluteTarget, absolutePackageDirectory)) {
    failures.push(
      `${packageDirectory}/package.json export ${exportKey} target ${target} must stay inside the package.`
    )
    return
  }

  if (target.includes("*")) {
    validateWildcardExportTarget({
      absolutePackageDirectory,
      exportKey,
      packageDirectory,
      target,
    })
    return
  }

  if (!fs.existsSync(absoluteTarget)) {
    failures.push(
      `${packageDirectory}/package.json export ${exportKey} target ${target} does not exist.`
    )
    return
  }

  if (!fs.statSync(absoluteTarget).isFile()) {
    failures.push(
      `${packageDirectory}/package.json export ${exportKey} target ${target} must be a file.`
    )
  }
}

function validateWildcardExportTarget({
  absolutePackageDirectory,
  exportKey,
  packageDirectory,
  target,
}: {
  readonly absolutePackageDirectory: string
  readonly exportKey: string
  readonly packageDirectory: string
  readonly target: string
}) {
  const wildcardCount = [...target].filter(
    (character) => character === "*"
  ).length

  if (wildcardCount !== 1) {
    failures.push(
      `${packageDirectory}/package.json export ${exportKey} target ${target} must use one wildcard.`
    )
    return
  }

  const [prefix = "", suffix = ""] = target.slice(2).split("*")
  const searchRoot = prefix.endsWith("/")
    ? prefix.slice(0, -1)
    : path.dirname(prefix)
  const absoluteSearchRoot = path.resolve(packageDirectory, searchRoot)

  if (!isPathInsideDirectory(absoluteSearchRoot, absolutePackageDirectory)) {
    failures.push(
      `${packageDirectory}/package.json export ${exportKey} target ${target} must stay inside the package.`
    )
    return
  }

  if (
    !fs.existsSync(absoluteSearchRoot) ||
    !fs.statSync(absoluteSearchRoot).isDirectory()
  ) {
    failures.push(
      `${packageDirectory}/package.json export ${exportKey} target ${target} base directory does not exist.`
    )
    return
  }

  const hasMatchingFile = collectFiles(absoluteSearchRoot).some((filePath) => {
    const relativeFilePath = normalizePath(
      path.relative(absolutePackageDirectory, filePath)
    )

    return (
      relativeFilePath.startsWith(prefix) && relativeFilePath.endsWith(suffix)
    )
  })

  if (!hasMatchingFile) {
    failures.push(
      `${packageDirectory}/package.json export ${exportKey} target ${target} has no matching files.`
    )
  }
}

function collectFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath]
  })
}

function isPathInsideDirectory(filePath: string, directory: string): boolean {
  const relativePath = path.relative(directory, filePath)

  return (
    relativePath.length === 0 ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  )
}

const workspaceInventoryResult =
  createRepositoryWorkspaceInventory(repositoryRoot)

if (workspaceInventoryResult.status === "failure") {
  failures.push(
    ...workspaceInventoryResult.errors.map(formatWorkspaceInventoryError)
  )
}

const workspaceEntries =
  workspaceInventoryResult.status === "success"
    ? workspaceInventoryResult.inventory.allWorkspaces
    : []

if (workspaceInventoryResult.status === "success") {
  validateVitestWorkspace(workspaceInventoryResult.inventory)
}
validateRootPackageScripts()
validateTurboTasks()
validatePackageExports(workspaceEntries)

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
