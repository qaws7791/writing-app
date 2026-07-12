import { afterEach, describe, expect, it } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import {
  createModuleGraph,
  createRepositoryInventory,
  findCycles,
} from "#repository-tooling/repository-graph"

const fixtureRoots: string[] = []

afterEach(() => {
  fixtureRoots
    .splice(0)
    .forEach((root) => fs.rmSync(root, { force: true, recursive: true }))
})

describe("repository graph", () => {
  it("type-only·re-export·dynamic·alias·package export를 구분해 수집한다", () => {
    const root = createFixture({
      "alias.ts": "export const aliasValue = true",
      "dynamic.ts": "export const dynamicValue = true",
      "entry.ts": [
        'import type { TypeValue } from "./type-only"',
        'export { runtimeValue } from "./runtime"',
        'void import("./dynamic")',
        'import { aliasValue } from "@/alias"',
        'import { packageValue } from "@fixture/pkg"',
        "export { aliasValue, packageValue }",
      ].join("\n"),
      "pkg.ts": "export const packageValue = true",
      "runtime.ts": "export const runtimeValue = true",
      "type-only.ts": "export type TypeValue = string",
    })

    const inventory = createRepositoryInventory({ root })
    const entry = inventory.find((file) => file.relativePath === "entry.ts")
    const graph = createModuleGraph({
      aliases: [{ prefix: "@/", root }],
      packages: [{ exports: { "./pkg": "./pkg.ts" }, name: "@fixture", root }],
      root,
    })
    const entryDependencies = graph.get(path.join(root, "entry.ts")) ?? []

    expect(entry?.references).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ runtime: false, source: "./type-only" }),
        expect.objectContaining({ kind: "export", source: "./runtime" }),
        expect.objectContaining({ kind: "dynamic", source: "./dynamic" }),
        expect.objectContaining({ source: "@/alias" }),
        expect.objectContaining({ source: "@fixture/pkg" }),
      ])
    )
    expect(
      entryDependencies.map((filePath) => path.basename(filePath))
    ).toEqual(["alias.ts", "dynamic.ts", "pkg.ts", "runtime.ts"])
  })

  it("의도적인 cycle의 source→target chain을 반환한다", () => {
    const root = createFixture({
      "a.ts": 'import "./b"',
      "b.ts": 'export * from "./c"',
      "c.ts": 'void import("./a")',
    })

    const cycles = findCycles(createModuleGraph({ root }))

    expect(cycles).toHaveLength(1)
    expect(cycles[0]?.chain.map((filePath) => path.basename(filePath))).toEqual(
      ["a.ts", "b.ts", "c.ts", "a.ts"]
    )
  })
})

function createFixture(files: Readonly<Record<string, string>>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "repository-graph-"))
  fixtureRoots.push(root)
  Object.entries(files).forEach(([fileName, content]) =>
    fs.writeFileSync(path.join(root, fileName), content)
  )
  return root
}
