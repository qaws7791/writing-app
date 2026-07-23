import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "bun:test"

import {
  createWorkspaceInventory,
  type WorkspaceInventory,
} from "#scripts/workspace-inventory"

const fixtureRoots: string[] = []

afterEach(() => {
  for (const fixtureRoot of fixtureRoots.splice(0)) {
    fs.rmSync(fixtureRoot, { force: true, recursive: true })
  }
})

describe("workspace inventory", () => {
  it("중첩 glob의 group container를 workspace로 오인하지 않는다", () => {
    const repositoryRoot = createFixtureRepository({
      "apps/web": { name: "@fixture/web" },
      "packages/config/env": { name: "@fixture/env" },
    })
    writeRootManifest(repositoryRoot, [
      "apps/*",
      "packages/modules/*",
      "packages/config/*",
    ])

    const inventory = expectSuccess(createWorkspaceInventory(repositoryRoot))
    expect(inventory.allWorkspaces.map(({ name }) => name)).toEqual([
      "@fixture/web",
      "@fixture/env",
    ])
  })

  it("생성 산출물만 남은 디렉터리를 workspace에서 제외한다", () => {
    const repositoryRoot = createFixtureRepository({
      "apps/web": { name: "@fixture/web" },
    })
    fs.mkdirSync(path.join(repositoryRoot, "packages/modules/removed/.turbo"), {
      recursive: true,
    })
    fs.mkdirSync(
      path.join(repositoryRoot, "packages/modules/removed/node_modules"),
      {
        recursive: true,
      }
    )

    const inventory = expectSuccess(createWorkspaceInventory(repositoryRoot))
    expect(inventory.allWorkspaces.map(({ name }) => name)).toEqual([
      "@fixture/web",
    ])
  })

  it("같은 package name이 중복되면 실패한다", () => {
    const repositoryRoot = createFixtureRepository({
      "apps/web": { name: "@fixture/duplicate" },
      "packages/modules/duplicate": { name: "@fixture/duplicate" },
    })

    const result = createWorkspaceInventory(repositoryRoot)
    expect(result.status).toBe("failure")
    if (result.status === "failure") {
      expect(result.errors.map(({ type }) => type)).toContain(
        "duplicate-workspace-name"
      )
    }
  })

  it("source가 있으나 manifest가 없으면 실패한다", () => {
    const repositoryRoot = createFixtureRepository({
      "apps/web": { name: "@fixture/web" },
    })
    fs.mkdirSync(path.join(repositoryRoot, "packages/modules/missing/src"), {
      recursive: true,
    })
    fs.writeFileSync(
      path.join(repositoryRoot, "packages/modules/missing/src/index.ts"),
      "export const missing = true"
    )

    const result = createWorkspaceInventory(repositoryRoot)
    expect(result.status).toBe("failure")
    if (result.status === "failure") {
      expect(result.errors.map(({ type }) => type)).toContain(
        "workspace-manifest-not-found"
      )
    }
  })

  it("지원하는 test runtime을 manifest script에서 분류한다", () => {
    const repositoryRoot = createFixtureRepository({
      "apps/web": {
        name: "@fixture/web",
        testScript: "vitest run --config vitest.config.ts",
      },
      "packages/modules/learning": {
        name: "@fixture/learning",
        testScript:
          "bun --bun ../../../node_modules/vitest/vitest.mjs run --config vitest.config.ts",
      },
    })

    const inventory = expectSuccess(createWorkspaceInventory(repositoryRoot))
    expect(
      inventory.testCapableWorkspaces.map(({ name, testRuntime }) => ({
        name,
        testRuntime,
      }))
    ).toEqual([
      { name: "@fixture/web", testRuntime: "node" },
      { name: "@fixture/learning", testRuntime: "bun" },
    ])
  })

  it("지원하지 않는 test runtime이면 실패한다", () => {
    const repositoryRoot = createFixtureRepository({
      "apps/web": {
        name: "@fixture/web",
        testScript: "tsx scripts/test.ts",
      },
    })

    const result = createWorkspaceInventory(repositoryRoot)
    expect(result.status).toBe("failure")
    if (result.status === "failure") {
      expect(result.errors.map(({ type }) => type)).toContain(
        "unsupported-test-runtime"
      )
    }
  })

  it("root manifest에 workspace glob이 없으면 실패한다", () => {
    const repositoryRoot = createFixtureRepository({})
    writeRootManifest(repositoryRoot, [])

    const result = createWorkspaceInventory(repositoryRoot)
    expect(result.status).toBe("failure")
    if (result.status === "failure") {
      expect(result.errors.map(({ type }) => type)).toContain(
        "invalid-workspace-globs"
      )
    }
  })

  it.each([
    [".", "./src/index.ts"],
    ["./*", "./src/*.ts"],
  ] as const)("package의 broad export %s를 거부한다", (exportKey, target) => {
    const repositoryRoot = createFixtureRepository({
      "packages/modules/learning": {
        exports: { [exportKey]: target },
        name: "@workspace/learning",
      },
    })
    fs.writeFileSync(path.join(repositoryRoot, "vitest.workspace.ts"), "[]")

    const result = runWorkspaceCheck(repositoryRoot)

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("must")
  })

  it("package의 explicit subpath export를 허용한다", () => {
    const repositoryRoot = createFixtureRepository({
      "packages/modules/learning": {
        exports: { "./module": "./src/index.ts" },
        name: "@workspace/learning",
      },
    })
    fs.writeFileSync(path.join(repositoryRoot, "vitest.workspace.ts"), "[]")

    expect(runWorkspaceCheck(repositoryRoot)).toEqual({
      exitCode: 0,
      stderr: "",
    })
  })
})

type FixtureWorkspace = {
  readonly exports?: Readonly<Record<string, string>>
  readonly name: string
  readonly testScript?: string
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
  for (const group of ["config", "infra", "modules", "shared"]) {
    fs.mkdirSync(path.join(repositoryRoot, "packages", group))
  }
  writeRootManifest(repositoryRoot, [
    "apps/*",
    "packages/modules/*",
    "packages/infra/*",
    "packages/shared/*",
    "packages/config/*",
  ])

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
  fs.mkdirSync(path.join(workspaceRoot, "src"), { recursive: true })
  fs.writeFileSync(
    path.join(workspaceRoot, "package.json"),
    JSON.stringify({
      exports: workspace.exports,
      name: workspace.name,
      private: true,
      scripts:
        workspace.testScript === undefined
          ? undefined
          : { test: workspace.testScript },
    })
  )
  fs.writeFileSync(
    path.join(workspaceRoot, "src/index.ts"),
    "export const fixture = true"
  )
}

function expectSuccess(
  result: ReturnType<typeof createWorkspaceInventory>
): WorkspaceInventory {
  expect(result.status).toBe("success")
  if (result.status === "failure")
    throw new Error(JSON.stringify(result.errors))
  return result.inventory
}

function runWorkspaceCheck(repositoryRoot: string): {
  readonly exitCode: number
  readonly stderr: string
} {
  const result = Bun.spawnSync(
    [
      process.execPath,
      path.join(import.meta.dir, "check-workspace-inventory.ts"),
    ],
    {
      cwd: repositoryRoot,
      stderr: "pipe",
      stdout: "ignore",
    }
  )

  return {
    exitCode: result.exitCode,
    stderr: result.stderr.toString(),
  }
}
