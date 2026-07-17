import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { afterEach, describe, expect, test } from "bun:test"
import {
  createModuleGraph,
  findCycles,
  type ModuleGraphReferenceKinds,
} from "@workspace/repository-tooling"

import { collapseCoreModuleGraphByCapability } from "./check-import-cycles"

const fixtureRoots: string[] = []

afterEach(() => {
  fixtureRoots
    .splice(0)
    .forEach((root) => fs.rmSync(root, { force: true, recursive: true }))
})

describe("core capability import cycle", () => {
  test("type-only import로 만든 capability cycle도 검출한다", () => {
    const coreSourceRoot = createCoreFixture({
      "modules/alpha/main.ts":
        'import type { Beta } from "#core/modules/beta/main"\nexport type Alpha = Beta',
      "modules/beta/main.ts":
        'import type { Alpha } from "#core/modules/alpha/main"\nexport type Beta = Alpha',
    })

    expect(readCapabilityCycles(coreSourceRoot, "runtime")).toEqual([])
    expect(readCapabilityCycles(coreSourceRoot, "all")).toEqual([
      ["alpha", "beta", "alpha"],
    ])
  })

  test("세 capability를 잇는 cycle chain을 검출한다", () => {
    const coreSourceRoot = createCoreFixture({
      "modules/alpha/main.ts":
        'import type { Beta } from "#core/modules/beta/main"\nexport type Alpha = Beta',
      "modules/beta/main.ts":
        'import type { Gamma } from "#core/modules/gamma/main"\nexport type Beta = Gamma',
      "modules/gamma/main.ts":
        'import type { Alpha } from "#core/modules/alpha/main"\nexport type Gamma = Alpha',
    })

    expect(readCapabilityCycles(coreSourceRoot, "all")).toEqual([
      ["alpha", "beta", "gamma", "alpha"],
    ])
  })

  test("file graph가 DAG여도 collapse 뒤 생긴 capability cycle을 검출한다", () => {
    const coreSourceRoot = createCoreFixture({
      "modules/alpha/source.ts":
        'import type { BetaTarget } from "#core/modules/beta/target"\nexport type AlphaSource = BetaTarget',
      "modules/alpha/target.ts": "export type AlphaTarget = string",
      "modules/beta/source.ts":
        'import type { AlphaTarget } from "#core/modules/alpha/target"\nexport type BetaSource = AlphaTarget',
      "modules/beta/target.ts": "export type BetaTarget = string",
    })
    const moduleGraph = createCoreModuleGraph(coreSourceRoot, "all")

    expect(findCycles(moduleGraph)).toEqual([])
    expect(
      findCycles(
        collapseCoreModuleGraphByCapability({
          coreSourceRoot,
          moduleGraph,
        })
      ).map(({ chain }) => chain)
    ).toEqual([["alpha", "beta", "alpha"]])
  })

  test("acyclic capability graph는 통과한다", () => {
    const coreSourceRoot = createCoreFixture({
      "modules/alpha/main.ts":
        'import type { Beta } from "#core/modules/beta/main"\nexport type Alpha = Beta',
      "modules/beta/main.ts":
        'import type { Gamma } from "#core/modules/gamma/main"\nexport type Beta = Gamma',
      "modules/gamma/main.ts": "export type Gamma = string",
    })

    expect(readCapabilityCycles(coreSourceRoot, "all")).toEqual([])
  })

  test("import-equals edge도 capability cycle에 포함한다", () => {
    const coreSourceRoot = createCoreFixture({
      "modules/alpha/main.ts":
        'import beta = require("#core/modules/beta/main")\nexport const value = beta.value',
      "modules/beta/main.ts":
        'import alpha = require("#core/modules/alpha/main")\nexport const value = alpha.value',
    })

    expect(readCapabilityCycles(coreSourceRoot, "runtime")).toEqual([
      ["alpha", "beta", "alpha"],
    ])
  })
})

function readCapabilityCycles(
  coreSourceRoot: string,
  referenceKinds: ModuleGraphReferenceKinds
): readonly (readonly string[])[] {
  const moduleGraph = createCoreModuleGraph(coreSourceRoot, referenceKinds)
  const capabilityGraph = collapseCoreModuleGraphByCapability({
    coreSourceRoot,
    moduleGraph,
  })

  return findCycles(capabilityGraph).map(({ chain }) => chain)
}

function createCoreModuleGraph(
  coreSourceRoot: string,
  referenceKinds: ModuleGraphReferenceKinds
): ReadonlyMap<string, readonly string[]> {
  return createModuleGraph({
    aliases: [{ prefix: "#core/", root: coreSourceRoot }],
    referenceKinds,
    root: coreSourceRoot,
  })
}

function createCoreFixture(files: Readonly<Record<string, string>>): string {
  const fixtureRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "core-capability-graph-")
  )
  const coreSourceRoot = path.join(fixtureRoot, "src")
  fixtureRoots.push(fixtureRoot)

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(coreSourceRoot, relativePath)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, content)
  }

  return coreSourceRoot
}
