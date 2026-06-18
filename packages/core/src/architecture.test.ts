import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

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
})

function readSourceFiles(rootPath: string): string[] {
  return readdirSync(rootPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(rootPath, entry.name)

    if (entry.isDirectory()) {
      return readSourceFiles(entryPath)
    }

    if (!entry.name.endsWith(".ts") || entry.name.endsWith(".d.ts")) {
      return []
    }

    return [entryPath]
  })
}

function readImports(filePath: string): string[] {
  const content = readFileSync(filePath, "utf8")
  const imports: string[] = []
  const importPattern =
    /\b(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g

  for (const match of content.matchAll(importPattern)) {
    const source = match[1] ?? match[2]

    if (source !== undefined) {
      imports.push(source)
    }
  }

  return imports
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

function formatViolation(filePath: string, detail: string): string {
  return `${relative(coreSourceRoot, filePath)} -> ${detail}`
}
