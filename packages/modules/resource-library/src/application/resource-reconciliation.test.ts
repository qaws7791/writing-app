import { describe, expect, it, vi } from "vitest"
import { err, ok } from "@workspace/kernel/result"

import { createResourceReconciliation } from "#resource-library/application/resource-reconciliation"
import {
  readResourceAssetId,
  readResourceNodeId,
} from "#resource-library/domain/resource-tree-node"
import { createResourceTreeRepositoryFake } from "#resource-library/test-support/resource-tree-repository-fake"

const requestedAt = new Date("2026-07-18T00:00:00.000Z")
const firstRoot = readResourceNodeId("root-1")
const secondRoot = readResourceNodeId("root-2")
const pending = Object.freeze([
  {
    assetId: readResourceAssetId("asset-1"),
    deleteRootId: firstRoot,
    objectKey: "root-1/asset-1.png",
    requestedAt,
  },
  {
    assetId: readResourceAssetId("asset-2"),
    deleteRootId: firstRoot,
    objectKey: "root-1/asset-2.png",
    requestedAt,
  },
  {
    assetId: readResourceAssetId("asset-3"),
    deleteRootId: secondRoot,
    objectKey: "root-2/asset-3.png",
    requestedAt,
  },
])

describe("resource asset reconciliation", () => {
  it("dry-run query는 pending을 읽기만 하고 storage·metadata를 변경하지 않는다", async () => {
    const deleteObjects = vi.fn(async () => ok(undefined))
    const completePermanentDelete = vi.fn(async () => ({
      kind: "ok" as const,
      value: undefined,
    }))
    const reconciliation = createResourceReconciliation({
      assetAuditObserver: () => undefined,
      storage: { deleteObjects, putObject: async () => ok({ url: "unused" }) },
      treeRepository: createResourceTreeRepositoryFake({
        completePermanentDelete,
        readPendingAssetDeletions: async () => pending,
      }),
    })

    await expect(reconciliation.dryRun.execute(10)).resolves.toEqual({
      pending,
    })
    expect(deleteObjects).not.toHaveBeenCalled()
    expect(completePermanentDelete).not.toHaveBeenCalled()
  })

  it("mutation command는 root별 멱등 key를 묶고 성공한 root만 완료한다", async () => {
    const observer = vi.fn()
    const completePermanentDelete = vi.fn(async () => ({
      kind: "ok" as const,
      value: undefined,
    }))
    const deleteObjects = vi.fn(async (keys: readonly string[]) =>
      keys[0]?.startsWith("root-1/") ? ok(undefined) : err({ retryable: true })
    )
    const reconciliation = createResourceReconciliation({
      assetAuditObserver: observer,
      storage: { deleteObjects, putObject: async () => ok({ url: "unused" }) },
      treeRepository: createResourceTreeRepositoryFake({
        completePermanentDelete,
        readPendingAssetDeletions: async () => pending,
      }),
    })

    await expect(reconciliation.mutation.execute(10)).resolves.toEqual({
      failedRootIds: [secondRoot],
      reconciledRootIds: [firstRoot],
    })
    expect(deleteObjects).toHaveBeenNthCalledWith(1, [
      "root-1/asset-1.png",
      "root-1/asset-2.png",
    ])
    expect(deleteObjects).toHaveBeenNthCalledWith(2, ["root-2/asset-3.png"])
    expect(completePermanentDelete).toHaveBeenCalledOnce()
    expect(completePermanentDelete).toHaveBeenCalledWith(firstRoot)
    expect(observer).toHaveBeenCalledWith({
      kind: "resource-asset-delete-failed",
      objectKeys: ["root-2/asset-3.png"],
      rootId: secondRoot,
    })
  })
})
