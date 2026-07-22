import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import type { Result } from "@workspace/kernel/result"
import type {
  AdminId,
  ResourceAssetId,
  ResourceDocumentId,
  ResourceFolderId,
  ResourceNodeId,
} from "@workspace/types/ids"
import type { ResourceDocumentIssue } from "@workspace/resource-document/resource-markdown"

import type {
  ResourceActor,
  ResourceActorProfile,
} from "#resource-library/domain/resource-access-policy"
import type {
  PendingResourceAssetDeletion,
  ResourceAsset,
  ResourceImageMimeType,
} from "#resource-library/domain/resource-asset"
import type { ResourceDocumentRecord } from "#resource-library/domain/resource-document"
import type { ResourceLibraryError } from "#resource-library/domain/resource-library-error"
import type {
  ResourceBreadcrumbItem,
  ResourceTreeEntry,
  ResourceTreeNode,
  ResourceTreeScope,
} from "#resource-library/domain/resource-tree-node"

export type ResourceCommandResult<TValue> =
  | Readonly<{ kind: "ok"; value: TValue }>
  | ResourceLibraryError

export type ResourceAdminSessionPort = Readonly<{
  resolveActor: (headers: Headers) => Promise<ResourceActor | null>
}>

export type ResourceActorDirectoryPort = Readonly<{
  readActors: (
    actorIds: readonly AdminId[]
  ) => Promise<readonly ResourceActorProfile[]>
}>

export type ResourceDocumentCodec = Readonly<{
  normalize: (
    markdown: string
  ) =>
    | Readonly<{ issues: readonly ResourceDocumentIssue[]; status: "invalid" }>
    | Readonly<{ markdown: string; status: "valid" }>
  prepareImport: (markdown: string) =>
    | Readonly<{ issues: readonly ResourceDocumentIssue[]; status: "invalid" }>
    | Readonly<{
        headingTitle: string | null
        markdown: string
        status: "valid"
      }>
  readPlainText: (
    markdown: string
  ) =>
    | Readonly<{ status: "invalid" }>
    | Readonly<{ status: "valid"; text: string }>
}>

export type ResourceStorageError = Readonly<{
  retryable: boolean
}>

export type ResourceObjectStoragePort = Readonly<{
  deleteObjects: (
    objectKeys: readonly string[]
  ) => Promise<Result<void, ResourceStorageError>>
  putObject: (input: {
    readonly body: Uint8Array
    readonly contentType: ResourceImageMimeType
    readonly objectKey: string
  }) => Promise<Result<Readonly<{ url: string }>, ResourceStorageError>>
}>

export type ResourceAssetRepository = Readonly<{
  createAsset: (
    input: ResourceAsset
  ) => Promise<
    Readonly<{ kind: "document-not-found" }> | Readonly<{ kind: "ok" }>
  >
}>

export type ResourceDocumentRepository = Readonly<{
  importDocument: (input: {
    readonly actorId: AdminId
    readonly bodyText: string
    readonly documentId: ResourceDocumentId
    readonly markdown: string
    readonly name: string
    readonly now: Date
    readonly parentId: ResourceFolderId | null
  }) => Promise<
    ResourceCommandResult<
      Readonly<{
        document: ResourceDocumentRecord
        node: ResourceTreeNode
      }>
    >
  >
  readDocument: (
    documentId: ResourceDocumentId
  ) => Promise<ResourceDocumentRecord | null>
  saveDocument: (input: {
    readonly actorId: AdminId
    readonly bodyText: string
    readonly contentMarkdown: string
    readonly documentId: ResourceDocumentId
    readonly expectedVersion: number
    readonly name: string
    readonly now: Date
  }) => Promise<
    | ResourceCommandResult<ResourceDocumentRecord>
    | Readonly<{
        document: ResourceDocumentRecord
        kind: "stale-version"
      }>
  >
}>

export type ResourceSearchRecord = Readonly<{
  excerpt: string | null
  id: ResourceDocumentId
  name: string
  path: readonly ResourceBreadcrumbItem[]
  version: number
}>

export type ResourceSearchRepository = Readonly<{
  search: (input: {
    readonly limit: number
    readonly query: string
  }) => Promise<readonly ResourceSearchRecord[]>
}>

type ResourceTreeCommandContext = Readonly<{
  actorId: AdminId
  now: Date
}>

export type ResourcePermanentDeletePlan = Readonly<{
  assets: readonly PendingResourceAssetDeletion[]
  documentCount: number
  folderCount: number
  rootId: ResourceNodeId
}>

export type ResourceTreeRepository = Readonly<{
  completePermanentDelete: (
    rootId: ResourceNodeId
  ) => Promise<ResourceCommandResult<void>>
  createNode: (
    input: ResourceTreeCommandContext &
      (
        | Readonly<{ kind: "document"; nodeId: ResourceDocumentId }>
        | Readonly<{ kind: "folder"; nodeId: ResourceFolderId }>
      ) &
      Readonly<{
        parentId: ResourceFolderId | null
        preferredName: string
      }>
  ) => Promise<ResourceCommandResult<Readonly<{ node: ResourceTreeNode }>>>
  moveNode: (
    input: ResourceTreeCommandContext &
      Readonly<{
        destinationParentId: ResourceFolderId | null
        nodeId: ResourceNodeId
      }>
  ) => Promise<ResourceCommandResult<Readonly<{ node: ResourceTreeNode }>>>
  preparePermanentDelete: (
    input: ResourceTreeCommandContext & Readonly<{ nodeId: ResourceNodeId }>
  ) => Promise<ResourceCommandResult<ResourcePermanentDeletePlan>>
  readPendingAssetDeletions: (
    limit: number
  ) => Promise<readonly PendingResourceAssetDeletion[]>
  readSubtree: (nodeId: ResourceNodeId) => Promise<readonly ResourceTreeNode[]>
  readTree: (scope: ResourceTreeScope) => Promise<readonly ResourceTreeEntry[]>
  renameFolder: (
    input: ResourceTreeCommandContext &
      Readonly<{ folderId: ResourceFolderId; name: string }>
  ) => Promise<ResourceCommandResult<Readonly<{ node: ResourceTreeNode }>>>
  restoreNode: (
    input: ResourceTreeCommandContext & Readonly<{ nodeId: ResourceNodeId }>
  ) => Promise<
    ResourceCommandResult<
      Readonly<{
        documentCount: number
        folderCount: number
        node: ResourceTreeNode
      }>
    >
  >
  trashNode: (
    input: ResourceTreeCommandContext & Readonly<{ nodeId: ResourceNodeId }>
  ) => Promise<
    ResourceCommandResult<
      Readonly<{ documentCount: number; folderCount: number }>
    >
  >
}>

export type ResourceAssetAuditObserver = (
  event:
    | Readonly<{
        assetId: ResourceAssetId
        documentId: ResourceDocumentId
        kind: "resource-asset-orphaned"
        objectKey: string
      }>
    | Readonly<{
        kind: "resource-asset-delete-failed"
        objectKeys: readonly string[]
        rootId: ResourceNodeId
      }>
) => void

export type ResourceLibraryDependencies = Readonly<{
  actorDirectory: ResourceActorDirectoryPort
  assetAuditObserver: ResourceAssetAuditObserver
  assetIdGenerator: IdGenerator<ResourceAssetId>
  assetRepository: ResourceAssetRepository
  clock: Clock
  codec: ResourceDocumentCodec
  documentIdGenerator: IdGenerator<ResourceDocumentId>
  documentRepository: ResourceDocumentRepository
  folderIdGenerator: IdGenerator<ResourceFolderId>
  searchRepository: ResourceSearchRepository
  storage: ResourceObjectStoragePort | null
  treeRepository: ResourceTreeRepository
}>
