import fs from "node:fs"
import path from "node:path"

import {
  createWorkspaceInventory,
  formatWorkspaceInventoryError,
  type WorkspaceInventory,
  type WorkspaceManifest,
} from "#scripts/workspace-inventory"

type JsonRecord = Record<string, unknown>

const repositoryRoot = process.cwd()
const failures: string[] = []

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
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

function validateWorkspaceNames(inventory: WorkspaceInventory) {
  for (const workspace of inventory.allWorkspaces) {
    if (!/^@workspace\/[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(workspace.name)) {
      failures.push(
        `${workspace.manifestPath} package name ${workspace.name} must use the @workspace/kebab-case convention.`
      )
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
      if (entry.directory.startsWith("packages/")) {
        failures.push(
          `${entry.directory}/package.json must declare explicit package exports.`
        )
      }
      continue
    }

    if (!isRecord(exportsValue)) {
      failures.push(
        `${entry.directory}/package.json exports must be an object.`
      )
      continue
    }
    if (Object.keys(exportsValue).length === 0) {
      failures.push(
        `${entry.directory}/package.json exports must not be empty.`
      )
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
  if (!exportKey.startsWith("./")) {
    failures.push(
      `${packageDirectory}/package.json export key ${exportKey} must be an explicit subpath.`
    )
  }

  if (exportKey.includes("*")) {
    failures.push(
      `${packageDirectory}/package.json export key ${exportKey} must not use a wildcard.`
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
    failures.push(
      `${packageDirectory}/package.json export ${exportKey} target ${target} must not use a wildcard.`
    )
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

function isPathInsideDirectory(filePath: string, directory: string): boolean {
  const relativePath = path.relative(directory, filePath)

  return (
    relativePath.length === 0 ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  )
}

const workspaceInventoryResult = createWorkspaceInventory(repositoryRoot)

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
  validateWorkspaceNames(workspaceInventoryResult.inventory)
  validateVitestWorkspace(workspaceInventoryResult.inventory)
}
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
