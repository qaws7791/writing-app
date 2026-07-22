import type { Database } from "bun:sqlite"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import {
  normalizeResourceMarkdown,
  prepareResourceMarkdownImport,
  readResourceMarkdownPlainText,
} from "@workspace/resource-document/resource-markdown"
import type {
  ResourceAssetId,
  ResourceDocumentId,
  ResourceFolderId,
} from "@workspace/types/ids"

import {
  createResourceAssetApplication,
  type ResourceAssetApplication,
} from "#resource-library/application/resource-asset-application"
import {
  createResourceDocumentApplication,
  type ResourceDocumentApplication,
  type ResourceDocumentCommandPort,
} from "#resource-library/application/resource-document-application"
import type {
  ResourceActorDirectoryPort,
  ResourceAdminSessionPort,
  ResourceAssetAuditObserver,
  ResourceObjectStoragePort,
} from "#resource-library/application/ports/resource-library-ports"
import {
  createResourceDocumentQuery,
  createResourceLibraryKnowledgeQuery,
  createResourceSearchQuery,
  type ResourceLibraryKnowledgeQuery,
} from "#resource-library/application/resource-library-queries"
import {
  createResourceReconciliation,
  type ResourceReconciliation,
} from "#resource-library/application/resource-reconciliation"
import {
  createResourceTreeApplication,
  type ResourceTreeApplication,
} from "#resource-library/application/resource-tree-application"
import { createDrizzleResourceAssetRepository } from "#resource-library/infrastructure/persistence/resource-asset-drizzle-repository"
import { createDrizzleResourceDocumentRepository } from "#resource-library/infrastructure/persistence/resource-document-drizzle-repository"
import { createDrizzleResourceSearchRepository } from "#resource-library/infrastructure/persistence/resource-search-drizzle-repository"
import { createDrizzleResourceTreeRepository } from "#resource-library/infrastructure/persistence/resource-tree-drizzle-repository"
import { runResourceLibrarySchemaMigration } from "#resource-library/infrastructure/persistence/schema-migration"
import {
  createResourceLibraryRoutes,
  type ResourceLibraryHttpRouteGroup,
} from "#resource-library/interface/http/resource-library-http"

export type ResourceLibraryModule = Readonly<{
  application: Readonly<{
    assets: ResourceAssetApplication
    documents: ResourceDocumentApplication
    tree: ResourceTreeApplication
  }>
  commands: ResourceDocumentCommandPort
  createAdminRoutes: (
    sessionPort: ResourceAdminSessionPort
  ) => ResourceLibraryHttpRouteGroup
  knowledgeQuery: ResourceLibraryKnowledgeQuery
  reconciliation: ResourceReconciliation
}>

export function createResourceLibraryModule(
  input: Readonly<{
    actorDirectory: ResourceActorDirectoryPort
    assetAuditObserver: ResourceAssetAuditObserver
    assetIdGenerator: IdGenerator<ResourceAssetId>
    clock: Clock
    database: WritingAppDatabase
    documentIdGenerator: IdGenerator<ResourceDocumentId>
    folderIdGenerator: IdGenerator<ResourceFolderId>
    sqlite: Database
    storage: ResourceObjectStoragePort | null
  }>
): ResourceLibraryModule {
  runResourceLibrarySchemaMigration(input.sqlite)
  const assetRepository = createDrizzleResourceAssetRepository(input.database)
  const documentRepository = createDrizzleResourceDocumentRepository(
    input.database
  )
  const searchRepository = createDrizzleResourceSearchRepository(input.database)
  const treeRepository = createDrizzleResourceTreeRepository(input.database)
  const dependencies = {
    ...input,
    assetRepository,
    codec: {
      normalize: normalizeResourceMarkdown,
      prepareImport: prepareResourceMarkdownImport,
      readPlainText: readResourceMarkdownPlainText,
    },
    documentRepository,
    searchRepository,
    treeRepository,
  }
  const assets = createResourceAssetApplication(dependencies)
  const documents = createResourceDocumentApplication(dependencies)
  const tree = createResourceTreeApplication(dependencies)
  const documentQuery = createResourceDocumentQuery({
    actorDirectory: input.actorDirectory,
    repository: documentRepository,
  })
  const searchQuery = createResourceSearchQuery(searchRepository)

  return Object.freeze({
    application: Object.freeze({ assets, documents, tree }),
    commands: Object.freeze({ saveDocument: documents.saveDocument }),
    createAdminRoutes(sessionPort) {
      return createResourceLibraryRoutes({
        assetApplication: assets,
        documentApplication: documents,
        documentQuery,
        searchQuery,
        sessionPort,
        treeApplication: tree,
      })
    },
    knowledgeQuery: createResourceLibraryKnowledgeQuery({
      documents: documentQuery,
      search: searchQuery,
    }),
    reconciliation: createResourceReconciliation({
      assetAuditObserver: input.assetAuditObserver,
      storage: input.storage,
      treeRepository,
    }),
  })
}
