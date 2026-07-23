import { describe, expect, it, vi } from "vitest"
import { err, ok } from "@workspace/kernel/result"
import type { AdminId } from "@workspace/types/ids"

import { createResourceAssetApplication } from "#resource-library/application/resource-asset-application"
import type { ResourceActor } from "#resource-library/domain/resource-access-policy"
import {
  readResourceAssetId,
  readResourceDocumentId,
} from "#resource-library/domain/resource-tree-node"

type AssetDependencies = Parameters<typeof createResourceAssetApplication>[0]

const now = new Date("2026-07-18T00:00:00.000Z")
const assetId = readResourceAssetId("asset-1")
const documentId = readResourceDocumentId("document-1")
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const actor: ResourceActor = Object.freeze({
  access: "allowed",
  email: "admin@example.com",
  id: "admin-1" as AdminId,
  name: "관리자",
})

describe("resource asset application", () => {
  it("검증 뒤 결정적 key로 storage를 호출하고 성공 후에만 metadata를 저장한다", async () => {
    const order: string[] = []
    const putObject = vi.fn(async () => {
      order.push("storage")
      return ok({ url: "https://assets.example.test/asset-1.png" })
    })
    const createAsset = vi.fn(async () => {
      order.push("database")
      return { kind: "ok" as const }
    })
    const application = createResourceAssetApplication(
      createDependencies({
        assetRepository: { createAsset },
        storage: { deleteObjects: async () => ok(undefined), putObject },
      })
    )

    const result = await application.uploadImage({
      actor,
      altText: "  운영 화면  ",
      bytes: png,
      documentId,
    })

    expect(result).toMatchObject({
      kind: "ok",
      value: {
        asset: {
          altText: "운영 화면",
          contentType: "image/png",
          id: assetId,
          objectKey: "resource-library/document-1/asset-1.png",
          status: "active",
        },
      },
    })
    expect(order).toEqual(["storage", "database"])
    expect(putObject).toHaveBeenCalledWith({
      body: png,
      contentType: "image/png",
      objectKey: "resource-library/document-1/asset-1.png",
    })
    expect(createAsset).toHaveBeenCalledOnce()
  })

  it("validation·authorization·storage 실패는 뒤 단계에 도달하지 않는다", async () => {
    const observer = vi.fn()
    const createAsset = vi.fn(async () => ({ kind: "ok" as const }))
    const putObject = vi.fn(async () => err({ retryable: true }))
    const application = createResourceAssetApplication(
      createDependencies({
        assetAuditObserver: observer,
        assetRepository: { createAsset },
        storage: { deleteObjects: async () => ok(undefined), putObject },
      })
    )

    await expect(
      application.uploadImage({
        actor,
        altText: " ",
        bytes: png,
        documentId,
      })
    ).resolves.toEqual({
      kind: "resource-validation",
      reason: "alt-text-empty",
    })
    await expect(
      application.uploadImage({
        actor: { ...actor, access: "forbidden" },
        altText: "운영 화면",
        bytes: png,
        documentId,
      })
    ).resolves.toEqual({ kind: "resource-forbidden" })
    expect(putObject).not.toHaveBeenCalled()
    expect(createAsset).not.toHaveBeenCalled()

    await expect(
      application.uploadImage({
        actor,
        altText: "운영 화면",
        bytes: png,
        documentId,
      })
    ).resolves.toEqual({
      compensation: "not-required",
      kind: "resource-storage-failure",
      operation: "upload",
      retryable: true,
    })
    expect(createAsset).not.toHaveBeenCalled()
    expect(observer).toHaveBeenCalledWith({
      kind: "resource-asset-storage-failed",
      operation: "upload",
      phase: "put-object",
      retryable: true,
    })
  })

  it("storage 미설정과 throw를 원문 없는 stable event로 분류한다", async () => {
    const unavailableObserver = vi.fn()
    const unavailableApplication = createResourceAssetApplication(
      createDependencies({
        assetAuditObserver: unavailableObserver,
        storage: null,
      })
    )

    await expect(upload(unavailableApplication)).resolves.toEqual({
      compensation: "not-required",
      kind: "resource-storage-failure",
      operation: "upload",
      retryable: false,
    })
    expect(unavailableObserver).toHaveBeenCalledWith({
      kind: "resource-asset-storage-failed",
      operation: "upload",
      phase: "availability-check",
      retryable: false,
    })

    const thrownObserver = vi.fn()
    const thrownApplication = createResourceAssetApplication(
      createDependencies({
        assetAuditObserver: thrownObserver,
        storage: {
          deleteObjects: async () => ok(undefined),
          putObject: async () => Promise.reject(new Error("storage-secret")),
        },
      })
    )

    await expect(upload(thrownApplication)).resolves.toEqual({
      compensation: "not-required",
      kind: "resource-storage-failure",
      operation: "upload",
      retryable: true,
    })
    expect(thrownObserver).toHaveBeenCalledWith({
      kind: "resource-asset-storage-failed",
      operation: "upload",
      phase: "put-object",
      retryable: true,
    })
    expect(JSON.stringify(thrownObserver.mock.calls)).not.toContain(
      "storage-secret"
    )
  })

  it("DB가 문서를 찾지 못하면 업로드 object를 보상 삭제한다", async () => {
    const deleteObjects = vi.fn(async () => ok(undefined))
    const application = createResourceAssetApplication(
      createDependencies({
        assetRepository: {
          createAsset: async () => ({ kind: "document-not-found" }),
        },
        storage: {
          deleteObjects,
          putObject: async () => ok({ url: "https://assets.example.test/a" }),
        },
      })
    )

    await expect(upload(application)).resolves.toEqual({
      kind: "resource-not-found",
      target: "document",
    })
    expect(deleteObjects).toHaveBeenCalledWith([
      "resource-library/document-1/asset-1.png",
    ])
  })

  it("DB exception 뒤 보상 삭제가 성공하면 persistence 실패를 보존한다", async () => {
    const observer = vi.fn()
    const application = createResourceAssetApplication(
      createDependencies({
        assetAuditObserver: observer,
        assetRepository: {
          createAsset: async () => Promise.reject(new Error("database down")),
        },
        storage: {
          deleteObjects: async () => ok(undefined),
          putObject: async () => ok({ url: "https://assets.example.test/a" }),
        },
      })
    )

    await expect(upload(application)).resolves.toEqual({
      kind: "resource-persistence-failure",
      operation: "register-asset",
    })
    expect(observer).not.toHaveBeenCalled()
  })

  it("DB와 보상 삭제가 모두 실패하면 orphan audit event와 명시적 결과를 남긴다", async () => {
    const observer = vi.fn()
    const application = createResourceAssetApplication(
      createDependencies({
        assetAuditObserver: observer,
        assetRepository: {
          createAsset: async () => Promise.reject(new Error("database down")),
        },
        storage: {
          deleteObjects: async () => err({ retryable: true }),
          putObject: async () => ok({ url: "https://assets.example.test/a" }),
        },
      })
    )

    await expect(upload(application)).resolves.toEqual({
      compensation: "failed",
      kind: "resource-storage-failure",
      operation: "upload",
      retryable: true,
    })
    expect(observer).toHaveBeenCalledWith({
      assetId,
      documentId,
      kind: "resource-asset-orphaned",
      objectKey: "resource-library/document-1/asset-1.png",
    })
  })
})

function createDependencies(
  overrides: Partial<AssetDependencies> = {}
): AssetDependencies {
  return {
    assetAuditObserver: () => undefined,
    assetIdGenerator: { next: () => assetId },
    assetRepository: { createAsset: async () => ({ kind: "ok" }) },
    clock: { now: () => now },
    storage: {
      deleteObjects: async () => ok(undefined),
      putObject: async () => ok({ url: "https://assets.example.test/a" }),
    },
    ...overrides,
  }
}

function upload(
  application: ReturnType<typeof createResourceAssetApplication>
) {
  return application.uploadImage({
    actor,
    altText: "운영 화면",
    bytes: png,
    documentId,
  })
}
