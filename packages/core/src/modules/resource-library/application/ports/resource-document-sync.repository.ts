import type { ResourceDocumentTransactionId } from "@workspace/core/modules/resource-library/domain/resource-document-sync"
import type { ResourceDocumentId } from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import type { ResourceCollaborationLoadResult } from "@workspace/core/modules/resource-library/application/ports/resource-collaboration.repository"

export type CommitResourceDocumentTransactionInput = {
  readonly actorId: string
  readonly bodyText: string
  readonly documentId: ResourceDocumentId
  readonly expectedStateVersion: number
  readonly markdown: string
  readonly now: Date
  readonly snapshot: Uint8Array
  readonly transactionId: ResourceDocumentTransactionId
  readonly update: Uint8Array
}

export type CommitResourceDocumentTransactionResult =
  | { readonly kind: "inactive" | "not-found" }
  | {
      readonly actualStateVersion: number
      readonly kind: "stale-state-version"
    }
  | {
      readonly contentRevision: number
      readonly kind: "accepted" | "already-accepted"
      readonly stateVersion: number
      readonly transactionId: ResourceDocumentTransactionId
    }

export type AcceptedResourceDocumentTransaction = {
  readonly contentRevision: number
  readonly kind: "already-accepted"
  readonly stateVersion: number
  readonly transactionId: ResourceDocumentTransactionId
}

export type ResourceDocumentSyncRepository = {
  readonly commitTransaction: (
    input: CommitResourceDocumentTransactionInput
  ) => Promise<CommitResourceDocumentTransactionResult>
  readonly findAcceptedTransaction: (input: {
    readonly documentId: ResourceDocumentId
    readonly transactionId: ResourceDocumentTransactionId
  }) => Promise<AcceptedResourceDocumentTransaction | undefined>
  readonly loadDocument: (
    documentId: ResourceDocumentId
  ) => Promise<ResourceCollaborationLoadResult>
  readonly readUpdates: (input: {
    readonly afterStateVersion: number
    readonly documentId: ResourceDocumentId
  }) => Promise<
    readonly {
      readonly stateVersion: number
      readonly update: Uint8Array
    }[]
  >
}
