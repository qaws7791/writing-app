import type { ResourceDocumentId } from "@workspace/core/modules/resource-library/domain/resource-tree-node"

export type ResourceCollaborationLoadResult =
  | { readonly kind: "not-found" }
  | { readonly kind: "inactive" }
  | {
      readonly kind: "ok"
      readonly value: {
        readonly contentMarkdown: string
        readonly snapshot: Uint8Array | null
        readonly stateVersion: number
      }
    }

export type FlushResourceCollaborationInput = {
  readonly actorId: string
  readonly bodyText: string
  readonly documentId: ResourceDocumentId
  readonly expectedStateVersion: number
  readonly markdown: string
  readonly now: Date
  readonly snapshot: Uint8Array
}

export type ResourceCollaborationFlushResult =
  | { readonly kind: "not-found" }
  | { readonly kind: "inactive" }
  | {
      readonly actualStateVersion: number
      readonly kind: "stale-state-version"
    }
  | {
      readonly kind: "ok"
      readonly value: {
        readonly contentRevision: number
        readonly stateVersion: number
      }
    }

export type ResourceCollaborationRepository = {
  readonly flush: (
    input: FlushResourceCollaborationInput
  ) => Promise<ResourceCollaborationFlushResult>
  readonly load: (
    documentId: ResourceDocumentId
  ) => Promise<ResourceCollaborationLoadResult>
}
