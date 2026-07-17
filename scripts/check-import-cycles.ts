import fs from "node:fs"
import path from "node:path"

import {
  createModuleGraph,
  createRepositoryWorkspaceInventory,
  findCycles,
  formatWorkspaceInventoryError,
  formatPath,
  type ModuleAlias,
  type PackageModule,
} from "@workspace/repository-tooling"

type JsonRecord = Record<string, unknown>

type ModuleCycleScope = {
  readonly aliases: readonly ModuleAlias[]
  readonly name: string
  readonly packages?: readonly PackageModule[]
  readonly root: string
}

export function inspectImportCycles(repositoryRoot: string): {
  readonly coreCapabilityCount: number
  readonly failures: readonly string[]
  readonly moduleCycleScopeCount: number
  readonly workspaceCount: number
} {
  const corePackage = readPackageModule(
    repositoryRoot,
    "packages/core/package.json"
  )
  const moduleCycleScopes: readonly ModuleCycleScope[] = [
    createAppScope(repositoryRoot, "apps/web", "학습자 web runtime"),
    createAppScope(repositoryRoot, "apps/admin", "관리자 web runtime"),
    createAppScope(repositoryRoot, "apps/api", "통합 API runtime"),
    {
      aliases: [
        {
          prefix: "#core/",
          root: absolute(repositoryRoot, "packages/core/src"),
        },
      ],
      name: "packages/core runtime modules",
      packages: [corePackage],
      root: "packages/core/src",
    },
  ] as const
  const failures: string[] = []
  const workspaceInventoryResult =
    createRepositoryWorkspaceInventory(repositoryRoot)

  if (workspaceInventoryResult.status === "failure") {
    failures.push(
      ...workspaceInventoryResult.errors.map(formatWorkspaceInventoryError)
    )
  }

  const workspacePackages =
    workspaceInventoryResult.status === "success"
      ? workspaceInventoryResult.inventory.allWorkspaces
      : []
  validateWorkspacePackageCycles(workspacePackages, failures)
  moduleCycleScopes.forEach((scope) =>
    validateModuleCycles(repositoryRoot, scope, failures)
  )
  const coreCapabilityCount = validateCoreCapabilityCycles({
    corePackage,
    failures,
    repositoryRoot,
  })

  return {
    coreCapabilityCount,
    failures,
    moduleCycleScopeCount: moduleCycleScopes.length,
    workspaceCount: workspacePackages.length,
  }
}

function createAppScope(
  repositoryRoot: string,
  directory: string,
  name: string
): ModuleCycleScope {
  return {
    aliases: [
      {
        prefix: "@/",
        root: absolute(repositoryRoot, `${directory}/src`),
      },
    ],
    name,
    root: `${directory}/src`,
  }
}

function validateWorkspacePackageCycles(
  workspacePackages: readonly {
    readonly dependencies: readonly string[]
    readonly name: string
  }[],
  failures: string[]
): void {
  const names = new Set(workspacePackages.map((item) => item.name))
  const graph = new Map(
    workspacePackages.map((item) => [
      item.name,
      item.dependencies.filter((dependency) => names.has(dependency)),
    ])
  )

  findCycles(graph).forEach(({ chain }) =>
    failures.push(
      `Workspace package runtime dependency cycle: ${chain.join(" -> ")}`
    )
  )
}

function validateModuleCycles(
  repositoryRoot: string,
  scope: ModuleCycleScope,
  failures: string[]
): void {
  const absoluteRoot = absolute(repositoryRoot, scope.root)
  const graph = createModuleGraph({
    aliases: scope.aliases,
    packages: scope.packages,
    root: absoluteRoot,
  })

  findCycles(graph).forEach(({ chain }) =>
    failures.push(
      `${scope.name} import cycle: ${chain
        .map((filePath) => formatPath(path.relative(absoluteRoot, filePath)))
        .join(" -> ")}`
    )
  )
}

function validateCoreCapabilityCycles({
  corePackage,
  failures,
  repositoryRoot,
}: {
  readonly corePackage: PackageModule
  readonly failures: string[]
  readonly repositoryRoot: string
}): number {
  const coreSourceRoot = absolute(repositoryRoot, "packages/core/src")
  const moduleGraph = createModuleGraph({
    aliases: [{ prefix: "#core/", root: coreSourceRoot }],
    packages: [corePackage],
    referenceKinds: "all",
    root: coreSourceRoot,
  })
  const capabilityGraph = collapseCoreModuleGraphByCapability({
    coreSourceRoot,
    moduleGraph,
  })

  findCycles(capabilityGraph).forEach(({ chain }) =>
    failures.push(
      `packages/core capability import cycle: ${chain.join(" -> ")}`
    )
  )

  return capabilityGraph.size
}

export function collapseCoreModuleGraphByCapability({
  coreSourceRoot,
  moduleGraph,
}: {
  readonly coreSourceRoot: string
  readonly moduleGraph: ReadonlyMap<string, readonly string[]>
}): ReadonlyMap<string, readonly string[]> {
  const dependenciesByCapability = new Map<string, Set<string>>()

  for (const [sourcePath, dependencyPaths] of moduleGraph) {
    const sourceCapability = readCoreCapability(coreSourceRoot, sourcePath)
    if (sourceCapability === null) continue

    const dependencies =
      dependenciesByCapability.get(sourceCapability) ?? new Set<string>()
    dependenciesByCapability.set(sourceCapability, dependencies)

    for (const dependencyPath of dependencyPaths) {
      const dependencyCapability = readCoreCapability(
        coreSourceRoot,
        dependencyPath
      )
      if (
        dependencyCapability !== null &&
        dependencyCapability !== sourceCapability
      ) {
        dependencies.add(dependencyCapability)
      }
    }
  }

  return new Map(
    [...dependenciesByCapability.entries()]
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([capability, dependencies]) => [
        capability,
        [...dependencies].sort(),
      ])
  )
}

function readCoreCapability(
  coreSourceRoot: string,
  filePath: string
): string | null {
  const relativePath = path.relative(
    path.resolve(coreSourceRoot),
    path.resolve(filePath)
  )
  if (
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    return null
  }

  const [directory, capability] = relativePath.split(path.sep)
  return directory === "modules" && capability !== undefined ? capability : null
}

function readPackageModule(
  repositoryRoot: string,
  manifestPath: string
): PackageModule {
  const manifest = readJsonFile(repositoryRoot, manifestPath)
  const name = manifest["name"]
  const exportsValue = manifest["exports"]

  if (typeof name !== "string" || !isRecord(exportsValue)) {
    throw new Error(`${manifestPath} package name과 exports가 필요하다.`)
  }

  return {
    exports: Object.fromEntries(
      Object.entries(exportsValue).map(([key, value]) => [
        key,
        readExportTargets(value),
      ])
    ),
    name,
    root: path.dirname(absolute(repositoryRoot, manifestPath)),
  }
}

function readExportTargets(value: unknown): string[] {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap(readExportTargets)
  if (isRecord(value)) return Object.values(value).flatMap(readExportTargets)
  return []
}

function readJsonFile(repositoryRoot: string, filePath: string): JsonRecord {
  const value: unknown = JSON.parse(
    fs.readFileSync(absolute(repositoryRoot, filePath), "utf8")
  )
  if (!isRecord(value)) throw new Error(`${filePath} must contain an object.`)
  return value
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function absolute(repositoryRoot: string, filePath: string): string {
  return path.join(repositoryRoot, filePath)
}

if (import.meta.main) {
  const result = inspectImportCycles(process.cwd())

  if (result.failures.length > 0) {
    console.error("Import cycle check failed.")
    result.failures.forEach((failure) => console.error(`- ${failure}`))
    process.exit(1)
  }

  console.log(
    `Import cycle check passed across ${result.workspaceCount} workspaces, ${result.moduleCycleScopeCount} full runtime scopes, and ${result.coreCapabilityCount} core capabilities.`
  )
}
