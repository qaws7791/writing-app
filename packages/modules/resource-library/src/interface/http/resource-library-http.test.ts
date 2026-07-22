import { describe, expect, it, vi } from "vitest"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { adminResourceImageMaxBytes } from "@workspace/contracts/resource-library/shared"
import { createApp } from "@workspace/http-platform/core"

import type { ResourceActor } from "#resource-library/domain/resource-access-policy"
import {
  readResourceAssetId,
  readResourceDocumentId,
  readResourceFolderId,
} from "#resource-library/domain/resource-tree-node"
import { createResourceLibraryRoutes } from "#resource-library/interface/http/resource-library-http"

type ResourceRouteDependencies = Parameters<
  typeof createResourceLibraryRoutes
>[0]

const adminId = adminIdSchema.parse("admin-1")
const folderId = readResourceFolderId("folder-1")
const documentId = readResourceDocumentId("document-1")
const now = new Date("2026-07-18T00:00:00.000Z")
const actorProfile = Object.freeze({
  email: "admin@example.com",
  id: adminId,
  name: "관리자",
})
const actor: ResourceActor = Object.freeze({
  ...actorProfile,
  access: "allowed",
})
const node = Object.freeze({
  id: documentId,
  kind: "document" as const,
  name: "운영 기준",
  normalizedName: "운영 기준",
  parentId: folderId,
  status: "active" as const,
  trashRootId: null,
})
const document = Object.freeze({
  contentMarkdown: "본문",
  createdAt: now,
  createdBy: actorProfile,
  id: documentId,
  name: "운영 기준",
  parentId: folderId,
  path: Object.freeze([{ id: folderId, name: "운영 자료" }]),
  status: "active" as const,
  updatedAt: now,
  updatedBy: actorProfile,
  version: 3,
})
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

describe("resource-library HTTP interface", () => {
  it("14개 read·write route 모두 admin authorization middleware와 security를 가진다", () => {
    const routes = createResourceLibraryRoutes(createDependencies())
    expect(routes).toHaveLength(14)
    for (const { route } of routes) {
      expect(route.middleware).toHaveLength(1)
      expect(route.security).toEqual([{ adminSessionCookie: [] }])
    }
  })

  it("unauthenticated와 forbidden을 application 호출 전에 거절한다", async () => {
    const readTree = vi.fn(async () => [])
    const app = createFixture({
      treeApplication: {
        ...createDependencies().treeApplication,
        readTree,
      },
    })

    const unauthenticated = await app.request("/resources/tree")
    const forbidden = await app.request("/resources/tree", {
      headers: { Cookie: "admin=forbidden" },
    })

    expect(unauthenticated.status).toBe(401)
    expect(forbidden.status).toBe(403)
    await expect(unauthenticated.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    })
    await expect(forbidden.json()).resolves.toMatchObject({ code: "FORBIDDEN" })
    expect(readTree).not.toHaveBeenCalled()
  })

  it("read와 write 응답에 private no-store를 적용하고 강한 ETag를 유지한다", async () => {
    const app = createFixture()
    const read = await app.request(`/resources/documents/${documentId}`, {
      headers: allowedHeaders(),
    })
    const write = await app.request("/resources/folders", {
      body: JSON.stringify({ parentId: null }),
      headers: { ...allowedHeaders(), "Content-Type": "application/json" },
      method: "POST",
    })

    for (const response of [read, write]) {
      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("private, no-store")
      expect(response.headers.get("vary")).toContain("Cookie")
    }
    expect(read.headers.get("etag")).toBe('"3"')
  })

  it("If-Match가 stale이면 저장하지 않은 최신 문서와 canonical 412 ETag를 반환한다", async () => {
    const saveDocument = vi.fn(async () => ({
      document,
      kind: "resource-conflict" as const,
      reason: "stale-version" as const,
    }))
    const app = createFixture({
      documentApplication: {
        ...createDependencies().documentApplication,
        saveDocument,
      },
    })

    const response = await app.request(`/resources/documents/${documentId}`, {
      body: JSON.stringify({ contentMarkdown: "새 본문", name: "새 제목" }),
      headers: {
        ...allowedHeaders(),
        "Content-Type": "application/json",
        "If-Match": '"2"',
      },
      method: "PUT",
    })

    expect(response.status).toBe(412)
    expect(response.headers.get("etag")).toBe('"3"')
    await expect(response.json()).resolves.toMatchObject({
      contentMarkdown: "본문",
      version: 3,
    })
    expect(saveDocument).toHaveBeenCalledWith({
      actor,
      contentMarkdown: "새 본문",
      documentId,
      expectedVersion: 2,
      name: "새 제목",
    })
  })

  it.each([
    ["not-required", "RESOURCE_ASSET_STORE_UNAVAILABLE"],
    ["failed", "RESOURCE_ASSET_COMPENSATION_FAILED"],
  ] as const)(
    "storage 실패의 compensation=%s를 canonical 503 %s로 구분한다",
    async (compensation, code) => {
      const app = createFixture({
        assetApplication: {
          uploadImage: async () => ({
            compensation,
            kind: "resource-storage-failure",
            operation: "upload",
            retryable: true,
          }),
        },
      })

      const response = await upload(app, png)
      expect(response.status).toBe(503)
      await expect(response.json()).resolves.toMatchObject({ code })
    }
  )

  it("MIME·size·alt text를 HTTP 경계에서 application 전에 검증한다", async () => {
    const uploadImage = vi.fn(createDependencies().assetApplication.uploadImage)
    const app = createFixture({ assetApplication: { uploadImage } })

    const unsupported = await upload(app, new Uint8Array([1, 2, 3]))
    const tooLarge = await upload(
      app,
      new Uint8Array(adminResourceImageMaxBytes + 1)
    )
    const missingAlt = await upload(app, png, " ")

    expect(unsupported.status).toBe(400)
    expect(tooLarge.status).toBe(413)
    expect(missingAlt.status).toBe(400)
    expect(uploadImage).not.toHaveBeenCalled()
  })
})

function createFixture(overrides: Partial<ResourceRouteDependencies> = {}) {
  return createApp({
    routes: createResourceLibraryRoutes({
      ...createDependencies(),
      ...overrides,
    }),
  })
}

function createDependencies(): ResourceRouteDependencies {
  const folderNode = Object.freeze({
    id: folderId,
    kind: "folder" as const,
    name: "운영 자료",
    normalizedName: "운영 자료",
    parentId: null,
    status: "active" as const,
    trashRootId: null,
  })
  return {
    assetApplication: {
      uploadImage: async (input) => ({
        kind: "ok",
        value: {
          asset: {
            altText: input.altText,
            byteSize: input.bytes.byteLength,
            contentType: "image/png",
            createdAt: now,
            documentId: input.documentId,
            id: readResourceAssetId("asset-1"),
            objectKey: "resource-library/document-1/asset-1.png",
            status: "active",
          },
          url: "https://assets.example.test/asset-1.png",
        },
      }),
    },
    documentApplication: {
      exportDocument: async () => ({
        kind: "ok",
        value: { fileName: "운영 기준.md", markdown: "# 운영 기준\n\n본문" },
      }),
      importDocument: async () => ({ kind: "ok", value: { document, node } }),
      saveDocument: async (input) => ({
        kind: "ok",
        value: { ...document, version: input.expectedVersion + 1 },
      }),
    },
    documentQuery: { readDocument: async () => document },
    searchQuery: { search: async () => [] },
    sessionPort: {
      async resolveActor(headers) {
        const cookie = headers.get("Cookie")
        if (cookie === null) return null
        return cookie === "admin=forbidden"
          ? { ...actor, access: "forbidden" }
          : actor
      },
    },
    treeApplication: {
      createDocument: async () => ({ kind: "ok", value: { node } }),
      createFolder: async () => ({
        kind: "ok",
        value: { node: folderNode },
      }),
      deleteNodePermanently: async () => ({
        kind: "ok",
        value: { documentCount: 1, folderCount: 1 },
      }),
      moveNode: async () => ({ kind: "ok", value: { node } }),
      readTree: async () => [{ hasChildren: false, node }],
      renameFolder: async () => ({
        kind: "ok",
        value: { node: folderNode },
      }),
      restoreNode: async () => ({
        kind: "ok",
        value: { documentCount: 1, folderCount: 1, node: folderNode },
      }),
      trashNode: async () => ({
        kind: "ok",
        value: { documentCount: 1, folderCount: 1 },
      }),
    },
  }
}

function allowedHeaders(): Record<string, string> {
  return { Cookie: "admin=allowed" }
}

function upload(
  app: ReturnType<typeof createFixture>,
  bytes: Uint8Array,
  altText = "운영 화면"
) {
  const form = new FormData()
  const fileBuffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(fileBuffer).set(bytes)
  form.set("altText", altText)
  form.set(
    "file",
    new File([fileBuffer], "resource.png", { type: "image/png" })
  )
  return app.request(`/resources/documents/${documentId}/images`, {
    body: form,
    headers: allowedHeaders(),
    method: "POST",
  })
}
