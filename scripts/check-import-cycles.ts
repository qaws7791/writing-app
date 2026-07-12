import fs from "node:fs"
import path from "node:path"

import {
  createModuleGraph,
  findCycles,
  formatPath,
  type ModuleAlias,
  type PackageModule,
} from "@workspace/repository-tooling"

type JsonRecord = Record<string, unknown>

type WorkspacePackage = {
  readonly dependencies: readonly string[]
  readonly directory: string
  readonly name: string
}

type ModuleCycleScope = {
  readonly aliases: readonly ModuleAlias[]
  readonly name: string
  readonly packages?: readonly PackageModule[]
  readonly root: string
}

const repositoryRoot = process.cwd()
const corePackage = readPackageModule("packages/core/package.json")
const moduleCycleScopes: readonly ModuleCycleScope[] = [
  createAppScope("apps/web", "학습자 web runtime"),
  createAppScope("apps/admin", "관리자 web runtime"),
  createAppScope("apps/api", "학습자 API runtime"),
  createAppScope("apps/admin-api", "관리자 API runtime"),
  {
    aliases: [{ prefix: "@/", root: absolute("packages/core/src") }],
    name: "core runtime",
    packages: [corePackage],
    root: "packages/core/src",
  },
] as const
const failures: string[] = []

function createAppScope(directory: string, name: string): ModuleCycleScope {
  return {
    aliases: [{ prefix: "@/", root: absolute(`${directory}/src`) }],
    name,
    root: `${directory}/src`,
  }
}

function discoverWorkspacePackages(): WorkspacePackage[] {
  const rootPackageJson = readJsonFile("package.json")
  const workspaceGlobs = readStringArray(rootPackageJson["workspaces"])

  return workspaceGlobs.flatMap((workspaceGlob) => {
    if (!workspaceGlob.endsWith("/*")) {
      failures.push(`Unsupported workspace glob: ${workspaceGlob}`)
      return []
    }

    const rootDirectory = workspaceGlob.slice(0, -2)
    const absoluteRootDirectory = absolute(rootDirectory)
    if (!fs.existsSync(absoluteRootDirectory)) return []

    return fs
      .readdirSync(absoluteRootDirectory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const directory = formatPath(path.join(rootDirectory, entry.name))
        const manifestPath = path.join(directory, "package.json")
        if (!fs.existsSync(absolute(manifestPath))) return []

        const manifest = readJsonFile(manifestPath)
        const name = manifest["name"]
        if (typeof name !== "string" || name.length === 0) {
          failures.push(`${manifestPath} must declare a package name.`)
          return []
        }

        return [
          {
            dependencies: isRecord(manifest["dependencies"])
              ? Object.keys(manifest["dependencies"])
              : [],
            directory,
            name,
          },
        ]
      })
  })
}

function validateWorkspacePackageCycles(
  workspacePackages: readonly WorkspacePackage[]
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

function validateModuleCycles(scope: ModuleCycleScope): void {
  const absoluteRoot = absolute(scope.root)
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

function readPackageModule(manifestPath: string): PackageModule {
  const manifest = readJsonFile(manifestPath)
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
    root: path.dirname(absolute(manifestPath)),
  }
}

function readExportTargets(value: unknown): string[] {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap(readExportTargets)
  if (isRecord(value)) return Object.values(value).flatMap(readExportTargets)
  return []
}

function readJsonFile(filePath: string): JsonRecord {
  const value: unknown = JSON.parse(fs.readFileSync(absolute(filePath), "utf8"))
  if (!isRecord(value)) throw new Error(`${filePath} must contain an object.`)
  return value
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function absolute(filePath: string): string {
  return path.join(repositoryRoot, filePath)
}

const workspacePackages = discoverWorkspacePackages()
validateWorkspacePackageCycles(workspacePackages)
moduleCycleScopes.forEach(validateModuleCycles)

if (failures.length > 0) {
  console.error("Import cycle check failed.")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(
  `Import cycle check passed across ${workspacePackages.length} workspaces and ${moduleCycleScopes.length} full runtime scopes.`
)
