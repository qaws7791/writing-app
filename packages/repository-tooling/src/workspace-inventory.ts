import fs from "node:fs"
import path from "node:path"

export type JsonValue =
  | boolean
  | null
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue }

export type TestRuntime = "bun" | "node"

export type WorkspaceManifest = {
  readonly dependencies: readonly string[]
  readonly directory: string
  readonly exportEntries: readonly {
    readonly key: string
    readonly value: JsonValue
  }[]
  readonly exportsValue: JsonValue | undefined
  readonly hasVitestConfig: boolean
  readonly manifestPath: string
  readonly name: string
  readonly scripts: Readonly<Record<string, string>>
  readonly testRuntime: TestRuntime | null
}

export type CoverageExclusionReason =
  | "no-test-script"
  | "repository-tooling"
  | "storybook-interaction-tests"

export type WorkspaceCoverageExclusion = {
  readonly reason: CoverageExclusionReason
  readonly workspace: WorkspaceManifest
}

export type WorkspaceInventory = {
  readonly allWorkspaces: readonly WorkspaceManifest[]
  readonly coverageExclusions: readonly WorkspaceCoverageExclusion[]
  readonly coverageTargets: readonly WorkspaceManifest[]
  readonly storybookTargets: readonly WorkspaceManifest[]
  readonly testCapableWorkspaces: readonly WorkspaceManifest[]
}

export type WorkspaceInventoryError =
  | {
      readonly glob: string
      readonly type: "unsupported-workspace-glob"
    }
  | {
      readonly directory: string
      readonly type: "workspace-root-not-found"
    }
  | {
      readonly manifestPath: string
      readonly type: "workspace-manifest-not-found"
    }
  | {
      readonly manifestPath: string
      readonly type: "invalid-workspace-manifest"
    }
  | {
      readonly manifestPath: string
      readonly type: "missing-workspace-name"
    }
  | {
      readonly manifestPaths: readonly string[]
      readonly name: string
      readonly type: "duplicate-workspace-name"
    }
  | {
      readonly manifestPath: string
      readonly script: string
      readonly type: "unsupported-test-runtime"
    }

export type WorkspaceInventoryResult =
  | {
      readonly inventory: WorkspaceInventory
      readonly status: "success"
    }
  | {
      readonly errors: readonly WorkspaceInventoryError[]
      readonly status: "failure"
    }

type WorkspaceInventoryOptions = {
  readonly coverageExclusions?: Readonly<
    Record<string, Exclude<CoverageExclusionReason, "no-test-script">>
  >
  readonly repositoryRoot: string
}

const repositoryCoverageExclusions = {
  "@workspace/repository-tooling": "repository-tooling",
} as const satisfies WorkspaceInventoryOptions["coverageExclusions"]

export function createRepositoryWorkspaceInventory(
  repositoryRoot: string
): WorkspaceInventoryResult {
  return createWorkspaceInventory({
    coverageExclusions: repositoryCoverageExclusions,
    repositoryRoot,
  })
}

export function createWorkspaceInventory({
  coverageExclusions = {},
  repositoryRoot,
}: WorkspaceInventoryOptions): WorkspaceInventoryResult {
  const rootManifestPath = path.join(repositoryRoot, "package.json")
  const rootManifest = readJsonObject(rootManifestPath)

  if (rootManifest === null) {
    return {
      errors: [
        {
          manifestPath: normalizePath(rootManifestPath),
          type: "invalid-workspace-manifest",
        },
      ],
      status: "failure",
    }
  }

  const workspaceGlobs = readStringArray(rootManifest["workspaces"])
  const errors: WorkspaceInventoryError[] = []
  const workspaceDirectories = workspaceGlobs.flatMap((workspaceGlob) =>
    expandWorkspaceGlob({
      errors,
      repositoryRoot,
      workspaceGlob,
    })
  )
  const workspaces = workspaceDirectories.flatMap((directory) => {
    const workspace = readWorkspaceManifest({
      directory,
      errors,
      repositoryRoot,
    })

    return workspace === null ? [] : [workspace]
  })

  reportDuplicateNames(workspaces, errors)

  if (errors.length > 0) {
    return {
      errors,
      status: "failure",
    }
  }

  const allWorkspaces = [...workspaces].sort((left, right) =>
    left.directory.localeCompare(right.directory)
  )
  const testCapableWorkspaces = allWorkspaces.filter(
    (workspace) => workspace.testRuntime !== null
  )
  const storybookTargets = allWorkspaces.filter(
    (workspace) => workspace.scripts["test:stories"] !== undefined
  )
  const coverageExclusionEntries = allWorkspaces.flatMap((workspace) => {
    const configuredReason = coverageExclusions[workspace.name]
    const reason: CoverageExclusionReason | null =
      configuredReason ??
      (workspace.scripts["test:stories"] === undefined
        ? workspace.testRuntime === null
          ? "no-test-script"
          : null
        : "storybook-interaction-tests")

    return reason === null ? [] : [{ reason, workspace }]
  })
  const coverageExcludedNames = new Set(
    coverageExclusionEntries.map(({ workspace }) => workspace.name)
  )
  const coverageTargets = testCapableWorkspaces.filter(
    (workspace) => !coverageExcludedNames.has(workspace.name)
  )

  return {
    inventory: {
      allWorkspaces,
      coverageExclusions: coverageExclusionEntries,
      coverageTargets,
      storybookTargets,
      testCapableWorkspaces,
    },
    status: "success",
  }
}

export function formatWorkspaceInventoryError(
  error: WorkspaceInventoryError
): string {
  switch (error.type) {
    case "unsupported-workspace-glob":
      return `Unsupported workspace glob: ${error.glob}`
    case "workspace-root-not-found":
      return `Workspace root does not exist: ${error.directory}`
    case "workspace-manifest-not-found":
      return `Workspace manifest does not exist: ${error.manifestPath}`
    case "invalid-workspace-manifest":
      return `${error.manifestPath} must contain a JSON object.`
    case "missing-workspace-name":
      return `${error.manifestPath} must declare a package name.`
    case "duplicate-workspace-name":
      return `Duplicate workspace name ${error.name}: ${error.manifestPaths.join(", ")}`
    case "unsupported-test-runtime":
      return `${error.manifestPath} test script has an unsupported runtime: ${error.script}`
  }
}

function expandWorkspaceGlob({
  errors,
  repositoryRoot,
  workspaceGlob,
}: {
  readonly errors: WorkspaceInventoryError[]
  readonly repositoryRoot: string
  readonly workspaceGlob: string
}): string[] {
  if (
    !workspaceGlob.endsWith("/*") ||
    workspaceGlob.slice(0, -2).includes("*")
  ) {
    errors.push({ glob: workspaceGlob, type: "unsupported-workspace-glob" })
    return []
  }

  const rootDirectory = workspaceGlob.slice(0, -2)
  const absoluteRootDirectory = path.join(repositoryRoot, rootDirectory)

  if (!fs.existsSync(absoluteRootDirectory)) {
    errors.push({
      directory: rootDirectory,
      type: "workspace-root-not-found",
    })
    return []
  }

  return fs
    .readdirSync(absoluteRootDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => normalizePath(path.join(rootDirectory, entry.name)))
}

function readWorkspaceManifest({
  directory,
  errors,
  repositoryRoot,
}: {
  readonly directory: string
  readonly errors: WorkspaceInventoryError[]
  readonly repositoryRoot: string
}): WorkspaceManifest | null {
  const manifestPath = path.join(repositoryRoot, directory, "package.json")

  if (!fs.existsSync(manifestPath)) {
    errors.push({
      manifestPath: normalizePath(path.relative(repositoryRoot, manifestPath)),
      type: "workspace-manifest-not-found",
    })
    return null
  }

  const manifest = readJsonObject(manifestPath)

  if (manifest === null) {
    errors.push({
      manifestPath: normalizePath(path.relative(repositoryRoot, manifestPath)),
      type: "invalid-workspace-manifest",
    })
    return null
  }

  const name = manifest["name"]

  if (typeof name !== "string" || name.length === 0) {
    errors.push({
      manifestPath: normalizePath(path.relative(repositoryRoot, manifestPath)),
      type: "missing-workspace-name",
    })
    return null
  }

  const scripts = readStringRecord(manifest["scripts"])
  const testScript = scripts["test"]
  const testRuntime =
    testScript === undefined
      ? null
      : inferTestRuntime(testScript, manifestPath, repositoryRoot, errors)

  return {
    dependencies: readObjectKeys(manifest["dependencies"]),
    directory,
    exportEntries: readObjectEntries(manifest["exports"]),
    exportsValue: manifest["exports"],
    hasVitestConfig: fs.existsSync(
      path.join(repositoryRoot, directory, "vitest.config.ts")
    ),
    manifestPath: normalizePath(path.join(directory, "package.json")),
    name,
    scripts,
    testRuntime,
  }
}

function inferTestRuntime(
  script: string,
  manifestPath: string,
  repositoryRoot: string,
  errors: WorkspaceInventoryError[]
): TestRuntime | null {
  if (/^bun(?:\s|$)/u.test(script)) return "bun"
  if (/^(?:node\s+.+\s+)?vitest(?:\s|$)/u.test(script)) return "node"

  errors.push({
    manifestPath: normalizePath(path.relative(repositoryRoot, manifestPath)),
    script,
    type: "unsupported-test-runtime",
  })
  return null
}

function reportDuplicateNames(
  workspaces: readonly WorkspaceManifest[],
  errors: WorkspaceInventoryError[]
): void {
  const manifestsByName = new Map<string, string[]>()

  for (const workspace of workspaces) {
    const manifestPaths = manifestsByName.get(workspace.name) ?? []
    manifestPaths.push(workspace.manifestPath)
    manifestsByName.set(workspace.name, manifestPaths)
  }

  for (const [name, manifestPaths] of manifestsByName) {
    if (manifestPaths.length > 1) {
      errors.push({
        manifestPaths: [...manifestPaths].sort(),
        name,
        type: "duplicate-workspace-name",
      })
    }
  }
}

function readJsonObject(
  filePath: string
): { readonly [key: string]: JsonValue } | null {
  try {
    const value: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"))
    return isJsonObject(value) ? value : null
  } catch {
    return null
  }
}

function isJsonObject(
  value: unknown
): value is { readonly [key: string]: JsonValue } {
  return (
    isJsonValue(value) && typeof value === "object" && !Array.isArray(value)
  )
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return true
  }

  if (Array.isArray(value)) return value.every(isJsonValue)
  if (typeof value !== "object") return false

  return Object.values(value).every(isJsonValue)
}

function readStringArray(value: JsonValue | undefined): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function readStringRecord(
  value: JsonValue | undefined
): Readonly<Record<string, string>> {
  if (!isJsonObject(value)) return {}

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  )
}

function readObjectKeys(value: JsonValue | undefined): string[] {
  return isJsonObject(value) ? Object.keys(value) : []
}

function readObjectEntries(
  value: JsonValue | undefined
): readonly { readonly key: string; readonly value: JsonValue }[] {
  return isJsonObject(value)
    ? Object.entries(value).map(([key, entryValue]) => ({
        key,
        value: entryValue,
      }))
    : []
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll(path.sep, "/")
}
