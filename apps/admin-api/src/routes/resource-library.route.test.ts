import { describe, expect, it, vi } from "vitest"
import { adminIdSchema } from "@workspace/contracts/admin"

import { createApp } from "@/app"
import { adminSessionExpiresAt } from "@/auth/admin-session"
import {
  createTestAdminApiDependencies,
  createTestAdminSessionResolver,
  testAdminNow,
} from "@/routes/test-dependencies"
import type {
  AdminResourceDocumentDto,
  AdminResourceNodeMutationDto,
} from "@workspace/contracts/admin"
import {
  toResourceDocumentId,
  toResourceDocumentTransactionId,
} from "@workspace/core/resource-library"

const headers = {
  Cookie: "admin_session_token=admin-token",
  "Content-Type": "application/json",
  Origin: "http://localhost:3001",
}

const documentNode = {
  hasChildren: false,
  id: "document-1",
  kind: "document",
  name: "운영 안내",
  parentId: "folder-1",
  sortOrder: 0,
  status: "active",
} as const

const mutation: AdminResourceNodeMutationDto = {
  affectedParentIds: ["folder-1"],
  node: documentNode,
  revision: 5,
}

const document: Extract<AdminResourceDocumentDto, { status: "active" }> = {
  contentRevision: 0,
  createdAt: "2026-06-14T03:00:00.000Z",
  createdBy: {
    email: "admin@example.com",
    id: "admin-1",
    name: "관리자",
  },
  id: "document-1",
  name: "운영 안내",
  parentId: "folder-1",
  path: [{ id: "folder-1", name: "운영" }],
  stateVersion: 0,
  status: "active",
  updatedAt: "2026-06-14T03:00:00.000Z",
  updatedBy: {
    email: "admin@example.com",
    id: "admin-1",
    name: "관리자",
  },
}

describe("어드민 API 자료실 트리 route", () => {
  it("활성 문서는 본문 없이 편집 메타데이터만 반환한다", async () => {
    const app = createApp(
      createTestAdminApiDependencies({
        adminServices: {
          resourceLibrary: {
            documents: {
              getDocument: vi.fn(async () => document),
            },
          },
        },
      })
    )

    const response = await app.request("/resources/documents/document-1", {
      headers,
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      contentRevision: 0,
      createdAt: "2026-06-14T03:00:00.000Z",
      createdBy: {
        email: "admin@example.com",
        id: "admin-1",
        name: "관리자",
      },
      id: "document-1",
      name: "운영 안내",
      parentId: "folder-1",
      path: [{ id: "folder-1", name: "운영" }],
      stateVersion: 0,
      status: "active",
      updatedAt: "2026-06-14T03:00:00.000Z",
      updatedBy: {
        email: "admin@example.com",
        id: "admin-1",
        name: "관리자",
      },
    })
  })

  it("Yjs transaction을 HTTP로 저장하고 승인 version을 반환한다", async () => {
    const publishDocumentVersion = vi.fn()
    const saveTransaction = vi.fn(async () => ({
      contentRevision: 4,
      kind: "accepted" as const,
      stateVersion: 7,
      transactionId: toResourceDocumentTransactionId("transaction-1"),
    }))
    const app = createApp(
      createTestAdminApiDependencies({
        adminServices: {
          resourceLibrary: {
            sync: { readSync: vi.fn(), saveTransaction },
          },
        },
        resourceEvents: {
          countActiveEditors: vi.fn(),
          publish: vi.fn(),
          publishDocumentInvalidated: vi.fn(),
          publishDocumentVersion,
        },
      })
    )

    const response = await app.request(
      "/resources/documents/document-1/transactions",
      {
        body: JSON.stringify({
          knownStateVersion: 3,
          transactionId: "transaction-1",
          updateBase64: "AQID",
        }),
        headers,
        method: "POST",
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      contentRevision: 4,
      kind: "accepted",
      stateVersion: 7,
      transactionId: "transaction-1",
    })
    expect(saveTransaction).toHaveBeenCalledWith({
      actorId: "admin-1",
      documentId: toResourceDocumentId("document-1"),
      knownStateVersion: 3,
      now: testAdminNow,
      transactionId: toResourceDocumentTransactionId("transaction-1"),
      update: Uint8Array.of(1, 2, 3),
    })
    expect(publishDocumentVersion).toHaveBeenCalledWith({
      contentRevision: 4,
      documentId: "document-1",
      stateVersion: 7,
      type: "resource-document-version-advanced",
    })
  })

  it("누적 quota와 projection deadline 거부를 명시적 HTTP 오류로 반환한다", async () => {
    const createSyncApp = (
      result:
        | {
            readonly actual: number
            readonly kind: "quota-exceeded"
            readonly limit: number
            readonly quota: "snapshot-bytes"
          }
        | {
            readonly elapsedMilliseconds: number
            readonly kind: "projection-timeout"
            readonly limitMilliseconds: number
          }
    ) =>
      createApp(
        createTestAdminApiDependencies({
          adminServices: {
            resourceLibrary: {
              sync: {
                readSync: vi.fn(),
                saveTransaction: vi.fn(async () => result),
              },
            },
          },
        })
      )
    const request = () => ({
      body: JSON.stringify({
        knownStateVersion: 0,
        transactionId: "transaction-1",
        updateBase64: "AQID",
      }),
      headers,
      method: "POST" as const,
    })

    const quotaResponse = await createSyncApp({
      actual: 4,
      kind: "quota-exceeded",
      limit: 3,
      quota: "snapshot-bytes",
    }).request("/resources/documents/document-1/transactions", request())
    expect(quotaResponse.status).toBe(422)
    await expect(quotaResponse.json()).resolves.toMatchObject({
      code: "RESOURCE_DOCUMENT_QUOTA_EXCEEDED",
    })

    const timeoutResponse = await createSyncApp({
      elapsedMilliseconds: 1_001,
      kind: "projection-timeout",
      limitMilliseconds: 1_000,
    }).request("/resources/documents/document-1/transactions", request())
    expect(timeoutResponse.status).toBe(503)
    await expect(timeoutResponse.json()).resolves.toMatchObject({
      code: "RESOURCE_DOCUMENT_PROJECTION_TIMEOUT",
    })
  })

  it("같은 문서의 transaction 저장이 끝난 뒤 Markdown을 내보낸다", async () => {
    const saveGate = deferred<{
      readonly contentRevision: number
      readonly kind: "accepted"
      readonly stateVersion: number
      readonly transactionId: ReturnType<typeof toResourceDocumentTransactionId>
    }>()
    const saveTransaction = vi.fn(() => saveGate.promise)
    const exportDocument = vi.fn(async () => ({
      kind: "ok" as const,
      value: { fileName: "운영 안내.md", markdown: "저장된 본문" },
    }))
    const app = createApp(
      createTestAdminApiDependencies({
        adminServices: {
          resourceLibrary: {
            documents: { exportDocument },
            sync: { readSync: vi.fn(), saveTransaction },
          },
        },
      })
    )
    const transactionResponse = app.request(
      "/resources/documents/document-1/transactions",
      {
        body: JSON.stringify({
          knownStateVersion: 0,
          transactionId: "transaction-1",
          updateBase64: "AQID",
        }),
        headers,
        method: "POST",
      }
    )
    await vi.waitFor(() => expect(saveTransaction).toHaveBeenCalledTimes(1))

    const exportResponse = app.request(
      "/resources/documents/document-1/export",
      { headers }
    )
    await Promise.resolve()
    expect(exportDocument).not.toHaveBeenCalled()

    saveGate.resolve({
      contentRevision: 1,
      kind: "accepted",
      stateVersion: 1,
      transactionId: toResourceDocumentTransactionId("transaction-1"),
    })
    const [saved, exported] = await Promise.all([
      transactionResponse,
      exportResponse,
    ])
    expect(saved.status).toBe(200)
    expect(exported.status).toBe(200)
    expect(exportDocument).toHaveBeenCalledTimes(1)
  })

  it("마지막 확인 version 뒤의 누락 update를 HTTP로 반환한다", async () => {
    const readSync = vi.fn(async () => ({
      fromStateVersion: 2,
      kind: "updates" as const,
      stateVersion: 4,
      updates: [Uint8Array.of(1, 2, 3), Uint8Array.of(4, 5, 6)],
    }))
    const app = createApp(
      createTestAdminApiDependencies({
        adminServices: {
          resourceLibrary: {
            sync: { readSync, saveTransaction: vi.fn() },
          },
        },
      })
    )

    const response = await app.request(
      "/resources/documents/document-1/sync?afterStateVersion=2",
      { headers }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      fromStateVersion: 2,
      kind: "updates",
      stateVersion: 4,
      updatesBase64: ["AQID", "BAUG"],
    })
    expect(readSync).toHaveBeenCalledWith({
      afterStateVersion: 2,
      documentId: toResourceDocumentId("document-1"),
      mode: "incremental",
    })
  })

  it("관리자 세션이 없으면 새 자료실 route도 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/resources/tree")

    expect(response.status).toBe(401)
  })

  it("루트 트리는 기본 active 범위로 조회하고 OpenAPI에 새 계약을 공개한다", async () => {
    const app = createApp(
      createTestAdminApiDependencies({
        adminServices: {
          resourceLibrary: {
            tree: {
              async getTree(input) {
                expect(input).toEqual({ parentId: null, scope: "active" })
                return { nodes: [], revision: 0 }
              },
            },
          },
        },
      })
    )

    const treeResponse = await app.request("/resources/tree", { headers })
    const openApiResponse = await app.request("/openapi")

    expect(treeResponse.status).toBe(200)
    await expect(treeResponse.json()).resolves.toEqual({
      nodes: [],
      revision: 0,
    })
    expect(openApiResponse.status).toBe(200)
    await expect(openApiResponse.json()).resolves.toHaveProperty([
      "paths",
      "/resources/documents/{documentId}/export",
      "get",
    ])
  })

  it("owner가 아닌 일반 운영자도 자료실 구조를 변경할 수 있다", async () => {
    const app = createApp(
      createTestAdminApiDependencies({
        adminServices: {
          resourceLibrary: {
            tree: {
              async createFolder(input) {
                expect(input.actorId).toBe("operator-1")
                return { kind: "ok", value: mutation }
              },
            },
          },
        },
        sessionResolver: createTestAdminSessionResolver({
          session: {
            admin: {
              email: "operator@example.com",
              id: adminIdSchema.parse("operator-1"),
              name: "운영자",
              role: "operator",
              twoFactorEnabled: false,
            },
            authenticationAssurance: "password",
            [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
          },
        }),
      })
    )

    const response = await app.request("/resources/folders", {
      body: JSON.stringify({ expectedRevision: 4, parentId: "folder-1" }),
      headers,
      method: "POST",
    })

    expect(response.status).toBe(200)
  })

  it("지연 트리 조회와 폴더·문서 생성, 이름·이동·휴지통·복원 명령을 제공한다", async () => {
    const app = createApp(createDependencies())

    const treeResponse = await app.request(
      "/resources/tree?parentId=folder-1&scope=active",
      { headers }
    )
    expect(treeResponse.status).toBe(200)
    await expect(treeResponse.json()).resolves.toEqual({
      nodes: [documentNode],
      revision: 4,
    })

    const folderResponse = await app.request("/resources/folders", {
      body: JSON.stringify({ expectedRevision: 4, parentId: "folder-1" }),
      headers,
      method: "POST",
    })
    expect(folderResponse.status).toBe(200)

    const documentResponse = await app.request("/resources/documents", {
      body: JSON.stringify({ expectedRevision: 4, parentId: "folder-1" }),
      headers,
      method: "POST",
    })
    expect(documentResponse.status).toBe(200)

    const renameResponse = await app.request(
      "/resources/nodes/document-1/name",
      {
        body: JSON.stringify({ expectedRevision: 4, name: "운영 안내" }),
        headers,
        method: "PATCH",
      }
    )
    expect(renameResponse.status).toBe(200)

    const moveResponse = await app.request("/resources/nodes/document-1/move", {
      body: JSON.stringify({
        destinationIndex: 0,
        destinationParentId: null,
        expectedRevision: 4,
      }),
      headers,
      method: "PATCH",
    })
    expect(moveResponse.status).toBe(200)

    const trashResponse = await app.request(
      "/resources/nodes/document-1/trash",
      {
        body: JSON.stringify({ expectedRevision: 4 }),
        headers,
        method: "POST",
      }
    )
    expect(trashResponse.status).toBe(200)
    await expect(trashResponse.json()).resolves.toMatchObject({
      documentCount: 1,
      folderCount: 0,
      revision: 5,
    })

    const restoreResponse = await app.request(
      "/resources/nodes/document-1/restore",
      {
        body: JSON.stringify({ expectedRevision: 4 }),
        headers,
        method: "POST",
      }
    )
    expect(restoreResponse.status).toBe(200)
  })

  it("Markdown 문서 조회·가져오기·내보내기와 FTS 검색을 제공한다", async () => {
    const app = createApp(createDependencies())

    const detailResponse = await app.request(
      "/resources/documents/document-1",
      { headers }
    )
    expect(detailResponse.status).toBe(200)
    await expect(detailResponse.json()).resolves.toEqual(document)

    const importResponse = await app.request("/resources/documents/import", {
      body: JSON.stringify({
        expectedRevision: 4,
        fileName: "운영 안내.md",
        markdown: "# 운영 안내\n\n실시간 공동 편집 본문",
        parentId: "folder-1",
      }),
      headers,
      method: "POST",
    })
    expect(importResponse.status).toBe(200)
    await expect(importResponse.json()).resolves.toEqual({ document, mutation })

    const exportResponse = await app.request(
      "/resources/documents/document-1/export",
      { headers }
    )
    expect(exportResponse.status).toBe(200)
    expect(exportResponse.headers.get("Content-Type")).toContain(
      "text/markdown"
    )
    expect(exportResponse.headers.get("Content-Disposition")).toContain(
      "attachment"
    )
    expect(exportResponse.headers.get("Cache-Control")).toBe(
      "private, no-store"
    )
    expect(exportResponse.headers.get("Vary")).toContain("Cookie")
    await expect(exportResponse.text()).resolves.toBe(
      "# 운영 안내\n\n실시간 공동 편집 본문"
    )

    const searchResponse = await app.request(
      "/resources/search?query=%EA%B3%B5%EB%8F%99&scope=active&limit=20",
      { headers }
    )
    expect(searchResponse.status).toBe(200)
    await expect(searchResponse.json()).resolves.toEqual({
      items: [
        {
          excerpt: "실시간 공동 편집 본문",
          id: "document-1",
          kind: "document",
          name: "운영 안내",
          path: [{ id: "folder-1", name: "운영" }],
        },
      ],
    })
  })

  it("stale revision은 409로 매핑한다", async () => {
    const app = createApp(
      createTestAdminApiDependencies({
        adminServices: {
          resourceLibrary: {
            tree: {
              async renameNode() {
                return { actualRevision: 9, kind: "stale-revision" }
              },
            },
          },
        },
      })
    )

    const response = await app.request("/resources/nodes/document-1/name", {
      body: JSON.stringify({ expectedRevision: 4, name: "충돌" }),
      headers,
      method: "PATCH",
    })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      code: "STALE_REVISION",
    })
  })

  it("휴지통 확인용 하위 문서 활성 편집자 수를 조회한다", async () => {
    const countActiveEditors = vi.fn(() => 3)
    const app = createApp(
      createTestAdminApiDependencies({
        adminServices: {
          resourceLibrary: {
            tree: {
              async getSubtreeDocumentIds(nodeId) {
                expect(nodeId).toBe("folder-1")
                return [
                  toResourceDocumentId("document-1"),
                  toResourceDocumentId("document-2"),
                ]
              },
            },
          },
        },
        resourceEvents: {
          countActiveEditors,
          publish: vi.fn(),
          publishDocumentInvalidated: vi.fn(),
          publishDocumentVersion: vi.fn(),
        },
      })
    )

    const response = await app.request(
      "/resources/nodes/folder-1/active-editors",
      { headers }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ activeEditorCount: 3 })
    expect(countActiveEditors).toHaveBeenCalledWith([
      toResourceDocumentId("document-1"),
      toResourceDocumentId("document-2"),
    ])
  })

  it("HTTP transaction과 같은 문서 순서에서 휴지통 변경 event를 보낸다", async () => {
    const trashNode = vi.fn(async () => ({
      kind: "ok" as const,
      value: {
        affectedParentIds: ["folder-1"],
        documentCount: 1,
        folderCount: 0,
        revision: 5,
      },
    }))
    const publish = vi.fn()
    const publishDocumentInvalidated = vi.fn()
    const app = createApp(
      createTestAdminApiDependencies({
        adminServices: {
          resourceLibrary: {
            tree: {
              async getSubtreeDocumentIds() {
                return [toResourceDocumentId("document-1")]
              },
              trashNode,
            },
          },
        },
        resourceEvents: {
          countActiveEditors: vi.fn(),
          publish,
          publishDocumentInvalidated,
          publishDocumentVersion: vi.fn(),
        },
      })
    )

    const response = await app.request("/resources/nodes/document-1/trash", {
      body: JSON.stringify({ expectedRevision: 4 }),
      headers,
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.not.toHaveProperty(
      "closedActiveRoomCount"
    )
    expect(publish).toHaveBeenCalledWith({
      action: "trash",
      affectedParentIds: ["folder-1"],
      nodeId: "document-1",
      revision: 5,
      type: "resource-tree-mutated",
    })
    expect(publishDocumentInvalidated).toHaveBeenCalledWith({
      documentId: "document-1",
      reason: "archived",
      type: "resource-document-invalidated",
    })
    expect(trashNode.mock.invocationCallOrder[0]).toBeLessThan(
      publish.mock.invocationCallOrder[0] ?? 0
    )
  })
})

function createDependencies() {
  return createTestAdminApiDependencies({
    adminServices: {
      resourceLibrary: {
        documents: {
          async exportDocument(input) {
            expect(input).toEqual({ documentId: "document-1" })
            return {
              kind: "ok",
              value: {
                fileName: "운영 안내.md",
                markdown: "# 운영 안내\n\n실시간 공동 편집 본문",
              },
            }
          },
          async getDocument(input) {
            expect(input).toEqual({ documentId: "document-1" })
            return document
          },
          async importDocument(input) {
            expect(input).toEqual({
              actorId: "admin-1",
              expectedRevision: 4,
              fileName: "운영 안내.md",
              markdown: "# 운영 안내\n\n실시간 공동 편집 본문",
              now: testAdminNow,
              parentId: "folder-1",
            })
            return { kind: "ok", value: { document, mutation } }
          },
        },
        search: {
          async search(input) {
            expect(input).toEqual({
              limit: 20,
              query: "공동",
              scope: "active",
            })
            return {
              items: [
                {
                  excerpt: "실시간 공동 편집 본문",
                  id: "document-1",
                  kind: "document",
                  name: "운영 안내",
                  path: [{ id: "folder-1", name: "운영" }],
                },
              ],
            }
          },
        },
        tree: {
          async createDocument(input) {
            expect(input).toEqual({
              actorId: "admin-1",
              expectedRevision: 4,
              now: testAdminNow,
              parentId: "folder-1",
            })
            return { kind: "ok", value: mutation }
          },
          async createFolder(input) {
            expect(input).toEqual({
              actorId: "admin-1",
              expectedRevision: 4,
              now: testAdminNow,
              parentId: "folder-1",
            })
            return { kind: "ok", value: mutation }
          },
          async getTree(input) {
            expect(input).toEqual({ parentId: "folder-1", scope: "active" })
            return { nodes: [documentNode], revision: 4 }
          },
          async getSubtreeDocumentIds(nodeId) {
            expect(nodeId).toBe("document-1")
            return [toResourceDocumentId("document-1")]
          },
          async moveNode(input) {
            expect(input).toMatchObject({
              actorId: "admin-1",
              destinationIndex: 0,
              destinationParentId: null,
              nodeId: "document-1",
            })
            return { kind: "ok", value: mutation }
          },
          async renameNode(input) {
            expect(input).toMatchObject({
              actorId: "admin-1",
              name: "운영 안내",
              nodeId: "document-1",
            })
            return { kind: "ok", value: mutation }
          },
          async restoreNode(input) {
            expect(input).toMatchObject({
              actorId: "admin-1",
              nodeId: "document-1",
            })
            return {
              kind: "ok",
              value: {
                ...mutation,
                documentCount: 1,
                folderCount: 0,
              },
            }
          },
          async trashNode(input) {
            expect(input).toMatchObject({
              actorId: "admin-1",
              nodeId: "document-1",
            })
            return {
              kind: "ok",
              value: {
                affectedParentIds: mutation.affectedParentIds,
                documentCount: 1,
                folderCount: 0,
                revision: mutation.revision,
              },
            }
          },
        },
      },
    },
  })
}

function deferred<TValue>() {
  let resolve: (value: TValue | PromiseLike<TValue>) => void = () => undefined
  const promise = new Promise<TValue>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}
