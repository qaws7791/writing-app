import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import {
  createRepositoryInventory,
  readModuleReferences,
} from "@workspace/repository-tooling"

const adminApiSourceRoot = dirname(fileURLToPath(import.meta.url))

describe("apps/admin-api architecture", () => {
  it("admin route wire contract는 contracts package를 직접 import한다", () => {
    const violations = readSourceFiles(resolve(adminApiSourceRoot, "routes"))
      .filter(isRouteFile)
      .flatMap((filePath) => {
        return readNamedImports(filePath)
          .filter(
            ({ importedName, source }) =>
              source === "@workspace/core/admin" &&
              isAdminWireContractName(importedName)
          )
          .map(({ importedName, source }) =>
            formatViolation(filePath, `${source}:${importedName}`)
          )
      })

    expect(violations).toEqual([])
  })

  it("admin route file은 raw Hono sub-app을 만들지 않는다", () => {
    const violations = readSourceFiles(resolve(adminApiSourceRoot, "routes"))
      .filter(isRouteFile)
      .flatMap((filePath) => {
        const imports = readNamedImports(filePath)
          .filter(({ source }) => source === "hono")
          .map(({ importedName, source }) =>
            formatViolation(filePath, `${source}:${importedName}`)
          )
        const instantiations = readSourceText(filePath).includes("new Hono(")
          ? [formatViolation(filePath, "new Hono()")]
          : []

        return [...imports, ...instantiations]
      })

    expect(violations).toEqual([])
  })
})

function readSourceFiles(rootPath: string): string[] {
  return createRepositoryInventory({ root: rootPath }).map((file) => file.path)
}

function isRouteFile(filePath: string): boolean {
  return filePath.endsWith(".route.ts")
}

function readNamedImports(filePath: string): {
  readonly importedName: string
  readonly source: string
}[] {
  return readModuleReferences(filePath).flatMap((reference) =>
    reference.kind === "import"
      ? reference.importedNames.map((importedName) => ({
          importedName,
          source: reference.source,
        }))
      : []
  )
}

function readSourceText(filePath: string): string {
  return readFileSync(filePath, "utf8")
}

function isAdminWireContractName(name: string): boolean {
  return (
    name.endsWith("Dto") ||
    name.endsWith("Request") ||
    name.endsWith("Schema") ||
    name.endsWith("Sort") ||
    name.endsWith("Direction") ||
    name.endsWith("StatusFilter")
  )
}

function formatViolation(filePath: string, source: string): string {
  return `${relative(adminApiSourceRoot, filePath).split(sep).join("/")} -> ${source}`
}
