import fs from "node:fs"
import path from "node:path"

type JsonObject = { readonly [key: string]: unknown }

const standardizedDependencies = new Set([
  "@tailwindcss/postcss",
  "react",
  "react-dom",
  "recharts",
  "vitest",
])
const dependencySections = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
] as const

export function findWorkspaceDependencyVersionDrift({
  catalog,
  manifests,
}: {
  readonly catalog: Readonly<Record<string, string>>
  readonly manifests: readonly {
    readonly path: string
    readonly value: JsonObject
  }[]
}): string[] {
  const failures: string[] = []

  for (const dependency of standardizedDependencies) {
    const version = catalog[dependency]
    if (
      version === undefined ||
      !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version)
    ) {
      failures.push(`catalog의 ${dependency}는 exact version이어야 한다.`)
    }
  }

  for (const manifest of manifests) {
    for (const sectionName of dependencySections) {
      const section = manifest.value[sectionName]
      if (!isObject(section)) continue

      for (const [dependency, version] of Object.entries(section)) {
        if (!standardizedDependencies.has(dependency)) continue
        if (version !== "catalog:") {
          failures.push(
            `${manifest.path} ${sectionName}.${dependency}는 catalog:를 사용해야 한다.`
          )
        }
      }
    }
  }

  return failures
}

if (import.meta.main) {
  const repositoryRoot = process.cwd()
  const rootManifest = readJson(path.join(repositoryRoot, "package.json"))
  const catalog = rootManifest["catalog"]

  if (!isStringMap(catalog)) {
    throw new Error("root package.json catalog가 필요하다.")
  }

  const manifests = ["apps", "packages"].flatMap((root) =>
    discoverManifests(path.join(repositoryRoot, root)).map((manifestPath) => ({
      path: normalizePath(path.relative(repositoryRoot, manifestPath)),
      value: readJson(manifestPath),
    }))
  )
  const failures = findWorkspaceDependencyVersionDrift({
    catalog,
    manifests,
  })

  if (failures.length > 0) {
    console.error("Workspace dependency version check failed.")
    failures.forEach((failure) => console.error(`- ${failure}`))
    process.exit(1)
  }

  console.log(
    `Workspace dependency versions use one catalog across ${manifests.length} workspaces.`
  )
}

function discoverManifests(root: string): string[] {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name, "package.json"))
    .filter((manifestPath) => fs.existsSync(manifestPath))
}

function readJson(filePath: string): JsonObject {
  const value: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"))
  if (!isObject(value)) throw new Error(`${filePath}는 JSON object여야 한다.`)
  return value
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isStringMap(
  value: unknown
): value is Readonly<Record<string, string>> {
  return (
    isObject(value) &&
    Object.values(value).every((item) => typeof item === "string")
  )
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll(path.sep, "/")
}
