import fs from "node:fs"
import path from "node:path"

import {
  createWorkspaceInventory,
  formatWorkspaceInventoryError,
} from "#scripts/workspace-inventory"

type JsonObject = { readonly [key: string]: unknown }
type ManifestInput = { readonly path: string; readonly value: JsonObject }

const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
] as const
const exactVersionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u

export function findWorkspaceDependencyVersionDrift({
  catalog,
  manifests,
}: {
  readonly catalog: Readonly<Record<string, string>>
  readonly manifests: readonly ManifestInput[]
}): string[] {
  const failures: string[] = []
  const consumersByDependency = collectConsumers(manifests)

  for (const [dependency, version] of Object.entries(catalog)) {
    const consumers = consumersByDependency.get(dependency) ?? new Set()
    if (consumers.size < 2) {
      failures.push(
        `catalog의 ${dependency}는 ${consumers.size}개 workspace만 사용합니다. 단일 consumer manifest가 version을 소유해야 합니다.`
      )
    }
    if (!exactVersionPattern.test(version)) {
      failures.push(`catalog의 ${dependency}는 exact version이어야 한다.`)
    }
  }

  for (const manifest of manifests) {
    for (const sectionName of dependencySections) {
      const section = manifest.value[sectionName]
      if (!isObject(section)) continue

      for (const [dependency, version] of Object.entries(section)) {
        if (typeof version !== "string") continue

        if (dependency.startsWith("@workspace/")) {
          if (version !== "workspace:*") {
            failures.push(
              `${manifest.path} ${sectionName}.${dependency}는 workspace:*를 사용해야 한다.`
            )
          }
          continue
        }

        const consumerCount = consumersByDependency.get(dependency)?.size ?? 0
        if (consumerCount >= 2) {
          if (catalog[dependency] === undefined) {
            failures.push(
              `${dependency}는 ${consumerCount}개 workspace가 사용하므로 root exact catalog가 필요하다.`
            )
          }
          if (version !== "catalog:") {
            failures.push(
              `${manifest.path} ${sectionName}.${dependency}는 catalog:를 사용해야 한다.`
            )
          }
        } else if (version === "catalog:") {
          failures.push(
            `${manifest.path} ${sectionName}.${dependency}는 단일 consumer이므로 직접 version을 선언해야 한다.`
          )
        }
      }
    }
  }

  return [...new Set(failures)].sort()
}

if (import.meta.main) {
  const repositoryRoot = process.cwd()
  const rootManifest = readJson(path.join(repositoryRoot, "package.json"))
  const catalog = rootManifest["catalog"]
  if (!isStringMap(catalog)) {
    throw new Error("root package.json catalog가 필요하다.")
  }

  const inventoryResult = createWorkspaceInventory(repositoryRoot)
  if (inventoryResult.status === "failure") {
    throw new Error(
      inventoryResult.errors.map(formatWorkspaceInventoryError).join("\n")
    )
  }
  const manifests = inventoryResult.inventory.allWorkspaces.map(
    ({ manifestPath }) => ({
      path: manifestPath,
      value: readJson(path.join(repositoryRoot, manifestPath)),
    })
  )
  const failures = findWorkspaceDependencyVersionDrift({ catalog, manifests })
  if (failures.length > 0) {
    console.error("Workspace dependency version check failed.")
    failures.forEach((failure) => console.error(`- ${failure}`))
    process.exit(1)
  }

  console.log(
    `${manifests.length}개 workspace의 공유 dependency가 root exact catalog를 사용합니다.`
  )
}

function collectConsumers(
  manifests: readonly ManifestInput[]
): ReadonlyMap<string, ReadonlySet<string>> {
  const consumersByDependency = new Map<string, Set<string>>()

  for (const manifest of manifests) {
    for (const sectionName of dependencySections) {
      const section = manifest.value[sectionName]
      if (!isObject(section)) continue
      for (const dependency of Object.keys(section)) {
        const consumers = consumersByDependency.get(dependency) ?? new Set()
        consumers.add(manifest.path)
        consumersByDependency.set(dependency, consumers)
      }
    }
  }

  return consumersByDependency
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
