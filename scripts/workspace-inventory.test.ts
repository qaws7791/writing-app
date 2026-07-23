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
  it("2단계 target glob과 package 24개 fixture를 고정한다", () => {
    const fixture = JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "scripts/fixtures/target-workspace-inventory.json"
        ),
        "utf8"
      )
    ) as {
      readonly apps: readonly string[]
      readonly packages: readonly string[]
    }

    expect(fixture.apps).toHaveLength(4)
    expect(fixture.packages).toHaveLength(24)
    expect(
      fixture.packages.filter((entry) => entry.startsWith("packages/modules/"))
    ).toHaveLength(6)
    expect(
      fixture.packages.filter((entry) => entry.startsWith("packages/infra/"))
    ).toHaveLength(8)
    expect(
      fixture.packages.filter((entry) => entry.startsWith("packages/shared/"))
    ).toHaveLength(7)
    expect(
      fixture.packages.filter((entry) => entry.startsWith("packages/config/"))
    ).toHaveLength(3)
  })

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
})

type FixtureWorkspace = {
  readonly name: string
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
    JSON.stringify({ name: workspace.name, private: true })
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
