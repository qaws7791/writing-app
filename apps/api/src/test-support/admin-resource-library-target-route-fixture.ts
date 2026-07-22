import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { adminResourceDocumentDtoSchema } from "@workspace/contracts/resource-library/admin-resource-documents"
import { adminResourceSearchItemDtoSchema } from "@workspace/contracts/resource-library/admin-resource-search"
import { adminResourceTreeNodeDtoSchema } from "@workspace/contracts/resource-library/admin-resource-tree"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { adminRoles } from "@workspace/identity/admin-actor"
import {
  toResourceAssetId,
  toResourceFolderId,
} from "@workspace/core/resource-library"
import type {
  ResourceAssetUseCase,
  ResourceDocumentUseCase,
  ResourceSearchUseCase,
  ResourceTreeUseCase,
} from "@workspace/core/resource-library"

import {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "@workspace/identity/sessions"
import { createAdminApp } from "@/http/admin-app"
import { createAdminResourceLibraryRoutes } from "@/modules/admin-resource-library/admin-resource-library.routes"
import type { ResourceAssetStore } from "@/resource-assets/resource-asset-store"
import type {
  AdminTargetRouteFixture,
  AdminTargetRouteFixtureJson,
} from "@/test-support/admin-target-route-fixture"

const fixtureNow = new Date("2026-07-18T00:00:00.000Z")
const folderNode = adminResourceTreeNodeDtoSchema.parse({
  hasChildren: true,
  id: "folder-1",
  kind: "folder",
  name: "운영 자료",
  parentId: null,
  status: "active",
})
const documentNode = adminResourceTreeNodeDtoSchema.parse({
  hasChildren: false,
  id: "document-1",
  kind: "document",
  name: "운영 기준",
  parentId: "folder-1",
  status: "active",
})
const document = adminResourceDocumentDtoSchema.parse({
  contentMarkdown: "본문",
  createdAt: "2026-07-16T00:00:00.000Z",
  createdBy: { email: "admin@example.com", id: "admin-1", name: "관리자" },
  id: "document-1",
  name: "운영 기준",
  parentId: "folder-1",
  path: [{ id: "folder-1", name: "운영 자료" }],
  status: "active",
  updatedAt: "2026-07-16T00:00:00.000Z",
  updatedBy: { email: "admin@example.com", id: "admin-1", name: "관리자" },
  version: 3,
})
const searchItem = adminResourceSearchItemDtoSchema.parse({
  excerpt: "검색 결과",
  id: "document-1",
  name: "운영 기준",
  path: [{ id: "folder-1", name: "운영 자료" }],
  version: 3,
})
const assetId = toResourceAssetId("resource-asset-1")
const deletedObjectKey = "resource-library/document-1/resource-asset-1.png"

export function createAdminResourceLibraryTargetRouteFixture(
  scenario: string
): AdminTargetRouteFixture {
  const journal = createEffectJournal()
  const sessionResolver = createSessionResolver(scenario)
  const assetStore = createAssetStore(journal)
  const app = createAdminApp({
    capabilityRoutes: createAdminResourceLibraryRoutes({
      assetService: createAssetService(journal),
      assetStore,
      documentService: createDocumentService(journal),
      now: () => fixtureNow,
      onObjectsDeleted: (objectKeys) => assetStore.deleteObjects(objectKeys),
      searchService: createSearchService(journal),
      sessionResolver,
      treeService: createTreeService(journal),
    }),
    sessionResolver,
  })

  return {
    fetch(request) {
      return app.fetch(request)
    },
    readEffectJournal() {
      return journal.read()
    },
  }
}

function createTreeService(journal: EffectJournal): ResourceTreeUseCase {
  return {
    async createDocument(input) {
      journal.record("tree.create-document", {
        actorId: input.actorId,
        now: input.now.toISOString(),
        parentId: input.parentId,
      })

      return { kind: "ok", value: { node: documentNode } }
    },
    async createFolder(input) {
      journal.record("tree.create-folder", {
        actorId: input.actorId,
        now: input.now.toISOString(),
        parentId: input.parentId,
      })

      return { kind: "ok", value: { node: folderNode } }
    },
    async deleteNodePermanently(input) {
      journal.record("tree.delete-permanently", {
        actorId: input.actorId,
        nodeId: input.nodeId,
        now: input.now.toISOString(),
      })

      return {
        kind: "ok",
        value: {
          documentCount: 1,
          folderCount: 2,
          r2ObjectKeys: [deletedObjectKey],
        },
      }
    },
    async getTree(input) {
      journal.record("tree.read", { scope: input.scope })
      return { nodes: [folderNode, documentNode] }
    },
    async moveNode(input) {
      journal.record("tree.move", {
        actorId: input.actorId,
        destinationParentId: input.destinationParentId,
        nodeId: input.nodeId,
        now: input.now.toISOString(),
      })

      return {
        kind: "ok",
        value: {
          node: {
            ...documentNode,
            parentId:
              input.destinationParentId === null
                ? null
                : toResourceFolderId(input.destinationParentId),
          },
        },
      }
    },
    async renameFolder(input) {
      journal.record("tree.rename-folder", {
        actorId: input.actorId,
        folderId: input.folderId,
        name: input.name,
        now: input.now.toISOString(),
      })

      return {
        kind: "ok",
        value: { node: { ...folderNode, name: input.name } },
      }
    },
    async restoreNode(input) {
      journal.record("tree.restore", {
        actorId: input.actorId,
        nodeId: input.nodeId,
        now: input.now.toISOString(),
      })

      return {
        kind: "ok",
        value: {
          documentCount: 1,
          folderCount: 1,
          node: folderNode,
        },
      }
    },
    async trashNode(input) {
      journal.record("tree.trash", {
        actorId: input.actorId,
        nodeId: input.nodeId,
        now: input.now.toISOString(),
      })

      return {
        kind: "ok",
        value: { documentCount: 1, folderCount: 1 },
      }
    },
  }
}

function createDocumentService(
  journal: EffectJournal
): ResourceDocumentUseCase {
  return {
    async exportDocument(input) {
      journal.record("documents.export", { documentId: input.documentId })

      return input.documentId === "missing"
        ? { kind: "not-found" as const }
        : {
            kind: "ok" as const,
            value: {
              fileName: "운영 기준.md",
              markdown: "# 운영 기준\n\n본문",
            },
          }
    },
    async getDocument(input) {
      journal.record("documents.get", { documentId: input.documentId })
      return input.documentId === "missing" ? null : document
    },
    async importDocument(input) {
      journal.record("documents.import", {
        actorId: input.actorId,
        fileName: input.fileName,
        markdown: input.markdown,
        now: input.now.toISOString(),
        parentId: input.parentId,
      })

      return {
        kind: "ok" as const,
        value: { document, node: documentNode },
      }
    },
    async saveDocument(input) {
      journal.record("documents.save", {
        actorId: input.actorId,
        contentMarkdown: input.contentMarkdown,
        documentId: input.documentId,
        expectedVersion: input.expectedVersion,
        name: input.name,
        now: input.now.toISOString(),
      })

      return {
        document: {
          ...document,
          contentMarkdown: input.contentMarkdown,
          name: input.name,
          updatedAt: fixtureNow.toISOString(),
          version: input.expectedVersion + 1,
        },
        kind: "ok" as const,
      }
    },
  }
}

function createAssetService(journal: EffectJournal): ResourceAssetUseCase {
  return {
    createAssetId() {
      return assetId
    },
    async registerImage(input) {
      journal.record("assets.register-image", {
        assetId: input.assetId,
        byteSize: input.byteSize,
        contentType: input.contentType,
        createdAt: input.createdAt.toISOString(),
        documentId: input.documentId,
        objectKey: input.objectKey,
      })

      return { kind: "ok" as const }
    },
  }
}

function createSearchService(journal: EffectJournal): ResourceSearchUseCase {
  return {
    async search(input) {
      journal.record("search.resources", {
        limit: input.limit,
        query: input.query,
      })

      return { items: [searchItem] }
    },
  }
}

function createAssetStore(journal: EffectJournal): ResourceAssetStore {
  return {
    async deleteObjects(objectKeys) {
      journal.record("assets.delete-objects", {
        objectKeys: [...objectKeys],
      })
    },
    async putObject(input) {
      journal.record("assets.put-object", {
        byteSize: input.body.byteLength,
        contentType: input.contentType,
        objectKey: input.objectKey,
      })

      return {
        url: "https://assets.example.test/resource-library/resource-asset-1.png",
      }
    },
  }
}

function createSessionResolver(scenario: string): AdminSessionResolver {
  const session = {
    admin: {
      email: "admin@example.com",
      id: adminIdSchema.parse("admin-1"),
      name: "관리자",
      role: readScenarioRole(scenario),
    },
    [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
  } as const satisfies AdminAuthenticatedSession

  return {
    async resolveSession(headers) {
      return readAdminSessionToken(headers) === "admin-token" ? session : null
    },
  }
}

function readScenarioRole(scenario: string) {
  if (scenario === "owner") return adminRoles.owner
  if (scenario === "operator") return adminRoles.operator

  throw new Error(
    `지원하지 않는 target admin resource library scenario입니다: ${scenario}`
  )
}

function readAdminSessionToken(headers: Headers): string | null {
  const cookies = headers.get("Cookie")
  if (cookies === null) return null

  const token = cookies
    .split(";")
    .map((cookie) => cookie.trim().split("=", 2))
    .find(([name]) => name === adminSessionCookieName)?.[1]

  return token === undefined ? null : decodeURIComponent(token)
}

type EffectJournal = {
  readonly read: () => readonly AdminTargetRouteFixtureJson[]
  readonly record: (effect: string, input: AdminTargetRouteFixtureJson) => void
}

function createEffectJournal(): EffectJournal {
  const entries: AdminTargetRouteFixtureJson[] = []
  let sequence = 0

  return {
    read() {
      return entries
    },
    record(effect, input) {
      sequence += 1
      entries.push({ effect, input, sequence })
    },
  }
}
