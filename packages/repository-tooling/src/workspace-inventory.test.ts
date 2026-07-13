import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import {
  createWorkspaceInventory,
  type WorkspaceInventory,
} from "#repository-tooling/workspace-inventory"

const fixtureRoots: string[] = []

afterEach(() => {
  for (const fixtureRoot of fixtureRoots.splice(0)) {
    fs.rmSync(fixtureRoot, { force: true, recursive: true })
  }
})

describe("workspace inventory", () => {
  it("manifest 집합에서 test, coverage, Storybook 대상을 파생한다", () => {
    const repositoryRoot = createFixtureRepository({
      "apps/storybook": {
        name: "@fixture/storybook",
        scripts: { "test:stories": "storybook test" },
      },
      "apps/web": {
        name: "@fixture/web",
        scripts: { test: "vitest run --config vitest.config.ts" },
        vitest: true,
      },
      "packages/tooling": {
        name: "@fixture/tooling",
        scripts: { test: "bun test ./src" },
        vitest: true,
      },
    })

    const result = createWorkspaceInventory({
      coverageExclusions: {
        "@fixture/tooling": "repository-tooling",
      },
      repositoryRoot,
    })
    const inventory = expectSuccess(result)

    expect(inventory.allWorkspaces.map(({ name }) => name)).toEqual([
      "@fixture/storybook",
      "@fixture/web",
      "@fixture/tooling",
    ])
    expect(
      inventory.testCapableWorkspaces.map(({ name, testRuntime }) => ({
        name,
        testRuntime,
      }))
    ).toEqual([
      { name: "@fixture/web", testRuntime: "node" },
      { name: "@fixture/tooling", testRuntime: "bun" },
    ])
    expect(inventory.coverageTargets.map(({ name }) => name)).toEqual([
      "@fixture/web",
    ])
    expect(
      inventory.coverageExclusions.map(({ reason, workspace }) => ({
        name: workspace.name,
        reason,
      }))
    ).toEqual([
      {
        name: "@fixture/storybook",
        reason: "storybook-interaction-tests",
      },
      { name: "@fixture/tooling", reason: "repository-tooling" },
    ])
    expect(inventory.storybookTargets.map(({ name }) => name)).toEqual([
      "@fixture/storybook",
    ])
  })

  it("workspace 추가와 삭제를 root glob에서 자동 반영한다", () => {
    const repositoryRoot = createFixtureRepository({
      "apps/web": { name: "@fixture/web" },
    })
    writeWorkspace(repositoryRoot, "packages/core", {
      name: "@fixture/core",
      scripts: { test: "vitest run" },
    })

    const addedInventory = expectSuccess(
      createWorkspaceInventory({ repositoryRoot })
    )
    expect(addedInventory.allWorkspaces.map(({ name }) => name)).toEqual([
      "@fixture/web",
      "@fixture/core",
    ])

    fs.rmSync(path.join(repositoryRoot, "apps/web"), {
      recursive: true,
    })
    const deletedInventory = expectSuccess(
      createWorkspaceInventory({ repositoryRoot })
    )
    expect(deletedInventory.allWorkspaces.map(({ name }) => name)).toEqual([
      "@fixture/core",
    ])
  })

  it("test script 변경을 capability와 runtime에 반영한다", () => {
    const repositoryRoot = createFixtureRepository({
      "apps/web": { name: "@fixture/web" },
    })

    const before = expectSuccess(createWorkspaceInventory({ repositoryRoot }))
    expect(before.testCapableWorkspaces).toHaveLength(0)

    writeWorkspace(repositoryRoot, "apps/web", {
      name: "@fixture/web",
      scripts: { test: "bun --bun vitest run" },
    })
    const after = expectSuccess(createWorkspaceInventory({ repositoryRoot }))
    expect(after.testCapableWorkspaces).toMatchObject([
      { name: "@fixture/web", testRuntime: "bun" },
    ])
  })

  it.each([
    {
      arrange: (repositoryRoot: string) => {
        writeRootManifest(repositoryRoot, ["apps/**"])
      },
      expectedType: "unsupported-workspace-glob",
      name: "지원하지 않는 glob",
    },
    {
      arrange: (repositoryRoot: string) => {
        fs.mkdirSync(path.join(repositoryRoot, "apps/missing"))
      },
      expectedType: "workspace-manifest-not-found",
      name: "누락된 manifest",
    },
    {
      arrange: (repositoryRoot: string) => {
        writeWorkspace(repositoryRoot, "packages/duplicate", {
          name: "@fixture/web",
        })
      },
      expectedType: "duplicate-workspace-name",
      name: "중복 package name",
    },
  ])("$name을 구조화된 오류로 반환한다", ({ arrange, expectedType }) => {
    const repositoryRoot = createFixtureRepository({
      "apps/web": { name: "@fixture/web" },
    })
    arrange(repositoryRoot)

    const result = createWorkspaceInventory({ repositoryRoot })

    expect(result.status).toBe("failure")
    if (result.status === "failure") {
      expect(result.errors.map(({ type }) => type)).toContain(expectedType)
    }
  })
})

type FixtureWorkspace = {
  readonly name: string
  readonly scripts?: Readonly<Record<string, string>>
  readonly vitest?: boolean
}

function createFixtureRepository(
  workspaces: Readonly<Record<string, FixtureWorkspace>>
): string {
  const repositoryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "workspace-inventory-")
  )
  fixtureRoots.push(repositoryRoot)
  fs.mkdirSync(path.join(repositoryRoot, "apps"))
  fs.mkdirSync(path.join(repositoryRoot, "packages"))
  writeRootManifest(repositoryRoot, ["apps/*", "packages/*"])

  for (const [directory, workspace] of Object.entries(workspaces)) {
    writeWorkspace(repositoryRoot, directory, workspace)
  }

  return repositoryRoot
}

function writeRootManifest(
  repositoryRoot: string,
  workspaces: readonly string[]
): void {
  fs.writeFileSync(
    path.join(repositoryRoot, "package.json"),
    JSON.stringify({ name: "fixture", private: true, workspaces })
  )
}

function writeWorkspace(
  repositoryRoot: string,
  directory: string,
  workspace: FixtureWorkspace
): void {
  const workspaceRoot = path.join(repositoryRoot, directory)
  fs.mkdirSync(workspaceRoot, { recursive: true })
  fs.writeFileSync(
    path.join(workspaceRoot, "package.json"),
    JSON.stringify({
      exports: { ".": "./src/index.ts" },
      name: workspace.name,
      scripts: workspace.scripts,
    })
  )

  if (workspace.vitest === true) {
    fs.writeFileSync(path.join(workspaceRoot, "vitest.config.ts"), "export {}")
  }
}

function expectSuccess(
  result: ReturnType<typeof createWorkspaceInventory>
): WorkspaceInventory {
  expect(result.status).toBe("success")
  if (result.status === "failure") {
    throw new Error(JSON.stringify(result.errors))
  }

  return result.inventory
}
