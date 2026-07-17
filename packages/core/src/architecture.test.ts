import { describe, expect, it } from "vitest"
import { existsSync, readFileSync, readdirSync } from "node:fs"
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
      "modules",
      "shared",
    ])
    const violations = readdirSync(coreSourceRoot, { withFileTypes: true })
      .map((entry) => entry.name)
      .filter((entryName) => !allowedEntries.has(entryName))

    expect(violations).toEqual([])
  })

  it("module root에는 중복 public api facade를 두지 않는다", () => {
    const violations = readdirSync(modulesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const indexPath = resolve(modulesRoot, entry.name, "index.ts")
        return existsSync(indexPath)
          ? [formatViolation(indexPath, "index.ts")]
          : []
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

  it("module public api facade의 canonical private alias를 판별한다", () => {
    expect(isModuleApiFacadeImport("#core/modules/admin/api/index")).toBe(true)
    expect(isModuleApiFacadeImport("#core/modules/admin/api")).toBe(false)
    expect(isModuleApiFacadeImport("#/modules/admin/api/index")).toBe(false)
    expect(
      isModuleApiFacadeImport(
        "#core/modules/admin/application/ports/admin-user.reader"
      )
    ).toBe(false)
  })

  it("domain과 production application 계층은 runtime adapter 의존성을 import하지 않는다", () => {
    const violations = readSourceFiles(modulesRoot)
      .filter(isDomainOrProductionApplicationSource)
      .flatMap((filePath) =>
        readImports(filePath)
          .filter(isRuntimeAdapterImport)
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("domain과 production application 계층은 infrastructure 구현을 import하지 않는다", () => {
    const violations = readSourceFiles(modulesRoot)
      .filter(isDomainOrProductionApplicationSource)
      .flatMap((filePath) =>
        readImports(filePath)
          .filter((source) => source.includes("/infrastructure/"))
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("production application 계층은 runtime I/O를 직접 생성하지 않는다", () => {
    const forbiddenExpressions = [
      { label: "Worker", pattern: /\bnew\s+Worker\s*\(/u },
      { label: "WebSocket", pattern: /\bnew\s+WebSocket\s*\(/u },
      { label: "fetch", pattern: /\bfetch\s*\(/u },
      { label: "process.env", pattern: /\bprocess\.env\b/u },
    ] as const
    const violations = readSourceFiles(modulesRoot)
      .filter(isProductionApplicationSource)
      .flatMap((filePath) => {
        const source = readFileSync(filePath, "utf8")

        return forbiddenExpressions
          .filter(({ pattern }) => pattern.test(source))
          .map(({ label }) => formatViolation(filePath, label))
      })

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

function isDomainOrProductionApplicationSource(filePath: string): boolean {
  const segments = filePath.split(sep)

  return segments.includes("domain") || isProductionApplicationSource(filePath)
}

function isProductionApplicationSource(filePath: string): boolean {
  return (
    filePath.split(sep).includes("application") &&
    !filePath.endsWith(".test.ts")
  )
}

function readImports(filePath: string): string[] {
  return readModuleReferences(filePath).map((reference) => reference.source)
}

function isFacadeFile(filePath: string): boolean {
  return filePath.endsWith(`${sep}api${sep}index.ts`)
}

function isModuleApiFacadeImport(source: string): boolean {
  return /^#core\/modules\/[^/]+\/api\/index$/u.test(source)
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
    source === "@hono" ||
    source.startsWith("@hono/") ||
    source === "openai" ||
    source.startsWith("openai/") ||
    source.startsWith("@mastra/") ||
    source === "@workspace/ui" ||
    source.startsWith("@workspace/ui/") ||
    source.startsWith("bun:") ||
    source === "node:fs" ||
    source.startsWith("node:fs/") ||
    source === "node:http" ||
    source === "node:https" ||
    source === "node:net"
  )
}

function isCoreContentModuleImport(source: string): boolean {
  return (
    source === "#core/modules/content" ||
    source.startsWith("#core/modules/content/")
  )
}

function formatViolation(filePath: string, detail: string): string {
  return `${relative(coreSourceRoot, filePath)} -> ${detail}`
}
