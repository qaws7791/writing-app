import { spawnSync } from "node:child_process"
import path from "node:path"
import { describe, expect, it } from "bun:test"

import {
  readTurboRunSummary,
  resolveTaskExecutionStatus,
} from "#scripts/ci-workspace-inventory-report"
import {
  createWorkspaceInventory,
  type WorkspaceManifest,
} from "#scripts/workspace-inventory"

describe("CI workspace 인벤토리", () => {
  it("현재 workspace의 지원 또는 제외 사유를 출력한다", () => {
    const inventoryResult = createWorkspaceInventory(process.cwd())
    expect(inventoryResult.status).toBe("success")
    if (inventoryResult.status === "failure") return

    const result = spawnSync(
      process.execPath,
      ["scripts/ci-workspace-inventory.ts", "test"],
      { encoding: "utf8" }
    )

    expect(result.status).toBe(0)
    expect(result.stdout.match(/^\| `.+` \|/gm)).toHaveLength(
      inventoryResult.inventory.allWorkspaces.length
    )
    expect(result.stdout).toContain("지원: `test`")
    expect(result.stdout).toContain("제외: `test` 스크립트 없음")
  })

  it("Turborepo 2.10.4 summary v1에서 실제 task 상태를 구분한다", () => {
    const inventoryResult = createWorkspaceInventory(process.cwd())
    expect(inventoryResult.status).toBe("success")
    if (inventoryResult.status === "failure") return

    const summary = readTurboRunSummary(
      path.join(process.cwd(), "scripts/fixtures/turbo-run-summary-v1.json")
    )
    const workspaces = new Map(
      inventoryResult.inventory.allWorkspaces.map((workspace) => [
        workspace.name,
        workspace,
      ])
    )

    expect(summary.turboVersion).toBe("2.10.4")
    expect(
      resolveTaskExecutionStatus({
        requestedTask: "test",
        summary,
        workspace: getWorkspace(workspaces, "@workspace/admin"),
      })
    ).toBe("executed")
    expect(
      resolveTaskExecutionStatus({
        requestedTask: "test",
        summary,
        workspace: getWorkspace(workspaces, "@workspace/env"),
      })
    ).toBe("cache-hit")
    expect(
      resolveTaskExecutionStatus({
        requestedTask: "test",
        summary,
        workspace: getWorkspace(workspaces, "@workspace/ui"),
      })
    ).toBe("failed")
    expect(
      resolveTaskExecutionStatus({
        requestedTask: "test",
        summary,
        workspace: getWorkspace(workspaces, "@workspace/nextjs-config"),
      })
    ).toBe("excluded")
    expect(
      resolveTaskExecutionStatus({
        requestedTask: "test",
        summary,
        workspace: getWorkspace(workspaces, "@workspace/web"),
      })
    ).toBe("skipped")
  })
})

function getWorkspace(
  workspaces: ReadonlyMap<string, WorkspaceManifest>,
  name: string
): WorkspaceManifest {
  const workspace = workspaces.get(name)
  if (workspace === undefined) throw new Error(`${name} workspace가 없습니다.`)
  return workspace
}
