import { describe, expect, it, vi } from "vitest"
import { err, ok } from "@workspace/kernel/result"
import type { AdminId } from "@workspace/types/ids"

import { createResourceTreeApplication } from "#resource-library/application/resource-tree-application"
import type { ResourceActor } from "#resource-library/domain/resource-access-policy"
import {
  readResourceAssetId,
  readResourceDocumentId,
  readResourceFolderId,
} from "#resource-library/domain/resource-tree-node"
import { createResourceTreeRepositoryFake } from "#resource-library/test-support/resource-tree-repository-fake"

type TreeDependencies = Parameters<typeof createResourceTreeApplication>[0]

const rootId = readResourceFolderId("folder-1")
const documentId = readResourceDocumentId("document-1")
const now = new Date("2026-07-18T00:00:00.000Z")
const actor: ResourceActor = Object.freeze({
  access: "allowed",
  email: "admin@example.com",
  id: "admin-1" as AdminId,
  name: "관리자",
})
const deletePlan = Object.freeze({
  assets: Object.freeze([
    {
      assetId: readResourceAssetId("asset-1"),
      deleteRootId: rootId,
      objectKey: "resource-library/document-1/asset-1.png",
      requestedAt: now,
    },
  ]),
  documentCount: 1,
  folderCount: 1,
  rootId,
})

describe("resource tree application", () => {
  it("pending 준비, object 삭제, metadata 완료 순서를 보존한다", async () => {
    const order: string[] = []
    const application = createResourceTreeApplication(
      createDependencies({
        storage: {
          async deleteObjects(keys) {
            order.push(`storage:${keys.join(",")}`)
            return ok(undefined)
          },
          putObject: async () => ok({ url: "unused" }),
        },
        treeRepository: createResourceTreeRepositoryFake({
          async completePermanentDelete() {
            order.push("complete")
            return { kind: "ok", value: undefined }
          },
          async preparePermanentDelete() {
            order.push("prepare")
            return { kind: "ok", value: deletePlan }
          },
        }),
      })
    )

    await expect(
      application.deleteNodePermanently({ actor, nodeId: rootId })
    ).resolves.toEqual({
      kind: "ok",
      value: { documentCount: 1, folderCount: 1 },
    })
    expect(order).toEqual([
      "prepare",
      "storage:resource-library/document-1/asset-1.png",
      "complete",
    ])
  })

  it("storage 실패 시 pending을 완료하지 않고 감사 event를 남긴다", async () => {
    const completePermanentDelete = vi.fn(async () => ({
      kind: "ok" as const,
      value: undefined,
    }))
    const observer = vi.fn()
    const application = createResourceTreeApplication(
      createDependencies({
        assetAuditObserver: observer,
        storage: {
          deleteObjects: async () => err({ retryable: true }),
          putObject: async () => ok({ url: "unused" }),
        },
        treeRepository: createResourceTreeRepositoryFake({
          completePermanentDelete,
          preparePermanentDelete: async () => ({
            kind: "ok",
            value: deletePlan,
          }),
        }),
      })
    )

    await expect(
      application.deleteNodePermanently({ actor, nodeId: rootId })
    ).resolves.toEqual({
      compensation: "not-required",
      kind: "resource-storage-failure",
      operation: "delete",
      retryable: true,
    })
    expect(completePermanentDelete).not.toHaveBeenCalled()
    expect(observer).toHaveBeenCalledWith({
      kind: "resource-asset-delete-failed",
      objectKeys: ["resource-library/document-1/asset-1.png"],
      rootId,
    })
  })

  it("storage가 없어도 object가 없는 subtree는 metadata 삭제를 완료한다", async () => {
    const completePermanentDelete = vi.fn(async () => ({
      kind: "ok" as const,
      value: undefined,
    }))
    const application = createResourceTreeApplication(
      createDependencies({
        storage: null,
        treeRepository: createResourceTreeRepositoryFake({
          completePermanentDelete,
          preparePermanentDelete: async () => ({
            kind: "ok",
            value: { ...deletePlan, assets: [] },
          }),
        }),
      })
    )

    await expect(
      application.deleteNodePermanently({ actor, nodeId: rootId })
    ).resolves.toMatchObject({ kind: "ok" })
    expect(completePermanentDelete).toHaveBeenCalledWith(rootId)
  })

  it("prepare·complete DB exception과 forbidden을 explicit result로 격리한다", async () => {
    const prepareFailure = createResourceTreeApplication(
      createDependencies({
        treeRepository: createResourceTreeRepositoryFake({
          preparePermanentDelete: async () =>
            Promise.reject(new Error("prepare failed")),
        }),
      })
    )
    await expect(
      prepareFailure.deleteNodePermanently({ actor, nodeId: rootId })
    ).resolves.toEqual({
      kind: "resource-persistence-failure",
      operation: "prepare-delete",
    })

    const completeFailure = createResourceTreeApplication(
      createDependencies({
        treeRepository: createResourceTreeRepositoryFake({
          completePermanentDelete: async () =>
            Promise.reject(new Error("complete failed")),
          preparePermanentDelete: async () => ({
            kind: "ok",
            value: { ...deletePlan, assets: [] },
          }),
        }),
      })
    )
    await expect(
      completeFailure.deleteNodePermanently({ actor, nodeId: rootId })
    ).resolves.toEqual({
      kind: "resource-persistence-failure",
      operation: "complete-delete",
    })

    await expect(
      completeFailure.deleteNodePermanently({
        actor: { ...actor, access: "forbidden" },
        nodeId: rootId,
      })
    ).resolves.toEqual({ kind: "resource-forbidden" })
  })
})

function createDependencies(
  overrides: Partial<TreeDependencies> = {}
): TreeDependencies {
  return {
    assetAuditObserver: () => undefined,
    clock: { now: () => now },
    documentIdGenerator: { next: () => documentId },
    folderIdGenerator: { next: () => rootId },
    storage: {
      deleteObjects: async () => ok(undefined),
      putObject: async () => ok({ url: "unused" }),
    },
    treeRepository: createResourceTreeRepositoryFake({
      preparePermanentDelete: async () => ({
        kind: "ok",
        value: deletePlan,
      }),
    }),
    ...overrides,
  }
}
