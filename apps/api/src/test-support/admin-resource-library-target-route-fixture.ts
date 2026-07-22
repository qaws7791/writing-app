import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import {
  adminResourceAssetIdSchema,
  adminResourceDocumentIdSchema,
  adminResourceFolderIdSchema,
} from "@workspace/contracts/resource-library/shared"
import {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "@workspace/identity/sessions"
import { adminRoles } from "@workspace/identity/admin-actor"
import { createResourceLibraryRoutes } from "@workspace/resource-library/http"

import { createAdminApp } from "@/http/admin-app"
import type {
  AdminTargetRouteFixture,
  AdminTargetRouteFixtureJson,
} from "@/test-support/admin-target-route-fixture"

type ResourceRouteDependencies = Parameters<
  typeof createResourceLibraryRoutes
>[0]

const fixtureNow = new Date("2026-07-18T00:00:00.000Z")
const adminId = adminIdSchema.parse("admin-1")
const folderId = adminResourceFolderIdSchema.parse("folder-1")
const documentId = adminResourceDocumentIdSchema.parse("document-1")
const assetId = adminResourceAssetIdSchema.parse("resource-asset-1")
const deletedObjectKey = "resource-library/document-1/resource-asset-1.png"
const actorProfile = Object.freeze({
  email: "admin@example.com",
  id: adminId,
  name: "관리자",
})
const folderNode = Object.freeze({
  id: folderId,
  kind: "folder" as const,
  name: "운영 자료",
  normalizedName: "운영 자료",
  parentId: null,
  status: "active" as const,
  trashRootId: null,
})
const documentNode = Object.freeze({
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
  createdAt: new Date("2026-07-16T00:00:00.000Z"),
  createdBy: actorProfile,
  id: documentId,
  name: "운영 기준",
  parentId: folderId,
  path: Object.freeze([{ id: folderId, name: "운영 자료" }]),
  status: "active" as const,
  updatedAt: new Date("2026-07-16T00:00:00.000Z"),
  updatedBy: actorProfile,
  version: 3,
})
const searchItem = Object.freeze({
  excerpt: "검색 결과",
  id: documentId,
  name: "운영 기준",
  path: Object.freeze([{ id: folderId, name: "운영 자료" }]),
  version: 3,
})

export function createAdminResourceLibraryTargetRouteFixture(
  scenario: string
): AdminTargetRouteFixture {
  const journal = createEffectJournal()
  const sessionResolver = createSessionResolver(scenario)
  const app = createAdminApp({
    capabilityRoutes: createResourceLibraryRoutes({
      assetApplication: createAssetApplication(journal),
      documentApplication: createDocumentApplication(journal),
      documentQuery: createDocumentQuery(journal),
      searchQuery: createSearchQuery(journal),
      sessionPort: createResourceSessionPort(scenario),
      treeApplication: createTreeApplication(journal),
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

function createTreeApplication(
  journal: EffectJournal
): ResourceRouteDependencies["treeApplication"] {
  return {
    async createDocument(input) {
      journal.record("tree.create-document", {
        actorId: input.actor.id,
        now: fixtureNow.toISOString(),
        parentId: input.parentId,
      })
      return { kind: "ok", value: { node: documentNode } }
    },
    async createFolder(input) {
      journal.record("tree.create-folder", {
        actorId: input.actor.id,
        now: fixtureNow.toISOString(),
        parentId: input.parentId,
      })
      return { kind: "ok", value: { node: folderNode } }
    },
    async deleteNodePermanently(input) {
      journal.record("tree.delete-permanently", {
        actorId: input.actor.id,
        nodeId: input.nodeId,
        now: fixtureNow.toISOString(),
      })
      journal.record("assets.delete-objects", {
        objectKeys: [deletedObjectKey],
      })
      return {
        kind: "ok",
        value: { documentCount: 1, folderCount: 2 },
      }
    },
    async moveNode(input) {
      journal.record("tree.move", {
        actorId: input.actor.id,
        destinationParentId: input.destinationParentId,
        nodeId: input.nodeId,
        now: fixtureNow.toISOString(),
      })
      return {
        kind: "ok",
        value: {
          node: Object.freeze({
            ...documentNode,
            parentId: input.destinationParentId,
          }),
        },
      }
    },
    async readTree(scope) {
      journal.record("tree.read", { scope })
      return [
        { hasChildren: true, node: folderNode },
        { hasChildren: false, node: documentNode },
      ]
    },
    async renameFolder(input) {
      journal.record("tree.rename-folder", {
        actorId: input.actor.id,
        folderId: input.folderId,
        name: input.name,
        now: fixtureNow.toISOString(),
      })
      return {
        kind: "ok",
        value: { node: Object.freeze({ ...folderNode, name: input.name }) },
      }
    },
    async restoreNode(input) {
      journal.record("tree.restore", {
        actorId: input.actor.id,
        nodeId: input.nodeId,
        now: fixtureNow.toISOString(),
      })
      return {
        kind: "ok",
        value: { documentCount: 1, folderCount: 1, node: folderNode },
      }
    },
    async trashNode(input) {
      journal.record("tree.trash", {
        actorId: input.actor.id,
        nodeId: input.nodeId,
        now: fixtureNow.toISOString(),
      })
      return {
        kind: "ok",
        value: { documentCount: 1, folderCount: 1 },
      }
    },
  }
}

function createDocumentApplication(
  journal: EffectJournal
): ResourceRouteDependencies["documentApplication"] {
  return {
    async exportDocument(requestedDocumentId) {
      journal.record("documents.export", { documentId: requestedDocumentId })
      return requestedDocumentId === "missing"
        ? { kind: "resource-not-found", target: "document" }
        : {
            kind: "ok",
            value: {
              fileName: "운영 기준.md",
              markdown: "# 운영 기준\n\n본문",
            },
          }
    },
    async importDocument(input) {
      journal.record("documents.import", {
        actorId: input.actor.id,
        fileName: input.fileName,
        markdown: input.markdown,
        now: fixtureNow.toISOString(),
        parentId: input.parentId,
      })
      return {
        kind: "ok",
        value: { document, node: documentNode },
      }
    },
    async saveDocument(input) {
      journal.record("documents.save", {
        actorId: input.actor.id,
        contentMarkdown: input.contentMarkdown,
        documentId: input.documentId,
        expectedVersion: input.expectedVersion,
        name: input.name,
        now: fixtureNow.toISOString(),
      })
      return {
        kind: "ok",
        value: Object.freeze({
          ...document,
          contentMarkdown: input.contentMarkdown,
          name: input.name,
          updatedAt: fixtureNow,
          version: input.expectedVersion + 1,
        }),
      }
    },
  }
}

function createDocumentQuery(
  journal: EffectJournal
): ResourceRouteDependencies["documentQuery"] {
  return {
    async readDocument(requestedDocumentId) {
      journal.record("documents.get", { documentId: requestedDocumentId })
      return requestedDocumentId === "missing" ? null : document
    },
  }
}

function createAssetApplication(
  journal: EffectJournal
): ResourceRouteDependencies["assetApplication"] {
  return {
    async uploadImage(input) {
      journal.record("documents.get", { documentId: input.documentId })
      journal.record("assets.put-object", {
        byteSize: input.bytes.byteLength,
        contentType: "image/png",
        objectKey: deletedObjectKey,
      })
      journal.record("assets.register-image", {
        assetId,
        byteSize: input.bytes.byteLength,
        contentType: "image/png",
        createdAt: fixtureNow.toISOString(),
        documentId: input.documentId,
        objectKey: deletedObjectKey,
      })
      return {
        kind: "ok",
        value: {
          asset: Object.freeze({
            altText: input.altText,
            byteSize: input.bytes.byteLength,
            contentType: "image/png",
            createdAt: fixtureNow,
            documentId: input.documentId,
            id: assetId,
            objectKey: deletedObjectKey,
            status: "active",
          }),
          url: "https://assets.example.test/resource-library/resource-asset-1.png",
        },
      }
    },
  }
}

function createSearchQuery(
  journal: EffectJournal
): ResourceRouteDependencies["searchQuery"] {
  return {
    async search(input) {
      journal.record("search.resources", input)
      return [searchItem]
    },
  }
}

function createResourceSessionPort(
  scenario: string
): ResourceRouteDependencies["sessionPort"] {
  readScenarioRole(scenario)
  return {
    async resolveActor(headers) {
      return readAdminSessionToken(headers) === "admin-token"
        ? Object.freeze({ ...actorProfile, access: "allowed" as const })
        : null
    },
  }
}

function createSessionResolver(scenario: string): AdminSessionResolver {
  const session = {
    admin: { ...actorProfile, role: readScenarioRole(scenario) },
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
