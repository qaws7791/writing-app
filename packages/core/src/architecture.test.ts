import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import {
  createRepositoryInventory,
  readModuleReferences,
} from "@workspace/repository-tooling"

const coreSourceRoot = dirname(fileURLToPath(import.meta.url))
const modulesRoot = resolve(coreSourceRoot, "modules")

describe("core architecture", () => {
  it("src 직하위에는 core 구조 entrypoint만 둔다", () => {
    const allowedEntries = new Set([
      "architecture.test.ts",
      "composition",
      "index.ts",
      "modules",
      "shared",
    ])
    const violations = readdirSync(coreSourceRoot, { withFileTypes: true })
      .map((entry) => entry.name)
      .filter((entryName) => !allowedEntries.has(entryName))

    expect(violations).toEqual([])
  })

  it("module root는 public api facade만 export한다", () => {
    const violations = readdirSync(modulesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const indexPath = resolve(modulesRoot, entry.name, "index.ts")
        const content = readFileSync(indexPath, "utf8").trim()

        return content ===
          `export * from "@workspace/core/modules/${entry.name}/api"`
          ? []
          : [formatViolation(indexPath, content)]
      })

    expect(violations).toEqual([])
  })

  it("module api facade는 infrastructure를 export하지 않는다", () => {
    const violations = readdirSync(modulesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const indexPath = resolve(modulesRoot, entry.name, "api", "index.ts")

        return readImports(indexPath)
          .filter((source) => source.includes("/infrastructure/"))
          .map((source) => formatViolation(indexPath, source))
      })

    expect(violations).toEqual([])
  })

  it("core 내부 구현은 module public api facade를 import하지 않는다", () => {
    const violations = readSourceFiles(coreSourceRoot)
      .filter((filePath) => !isFacadeFile(filePath))
      .flatMap((filePath) =>
        readImports(filePath)
          .filter(isModuleApiFacadeImport)
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("domain 계층은 runtime adapter 의존성을 import하지 않는다", () => {
    const violations = readSourceFiles(modulesRoot)
      .filter((filePath) => filePath.split(sep).includes("domain"))
      .flatMap((filePath) =>
        readImports(filePath)
          .filter(isRuntimeAdapterImport)
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("learning domain은 content module facade나 domain 파일을 직접 import하지 않는다", () => {
    const learningDomainRoot = resolve(modulesRoot, "learning", "domain")
    const violations = readSourceFiles(learningDomainRoot).flatMap((filePath) =>
      readImports(filePath)
        .filter(isCoreContentModuleImport)
        .map((source) => formatViolation(filePath, source))
    )

    expect(violations).toEqual([])
  })
})

function readSourceFiles(rootPath: string): string[] {
  return createRepositoryInventory({ root: rootPath }).map((file) => file.path)
}

function readImports(filePath: string): string[] {
  return readModuleReferences(filePath).map((reference) => reference.source)
}

function isFacadeFile(filePath: string): boolean {
  return filePath.endsWith(`${sep}index.ts`)
}

function isModuleApiFacadeImport(source: string): boolean {
  return /^@workspace\/core\/modules\/[^/]+\/api$/.test(source)
}

function isRuntimeAdapterImport(source: string): boolean {
  return (
    source === "@workspace/db" ||
    source.startsWith("@workspace/db/") ||
    source === "better-auth" ||
    source.startsWith("better-auth/") ||
    source === "drizzle-orm" ||
    source.startsWith("drizzle-orm/") ||
    source === "hono" ||
    source.startsWith("hono/") ||
    source === "openai" ||
    source.startsWith("openai/")
  )
}

function isCoreContentModuleImport(source: string): boolean {
  return (
    source === "@workspace/core/content" ||
    source.startsWith("@workspace/core/content/") ||
    source === "@workspace/core/modules/content" ||
    source.startsWith("@workspace/core/modules/content/")
  )
}

function formatViolation(filePath: string, detail: string): string {
  return `${relative(coreSourceRoot, filePath)} -> ${detail}`
}
