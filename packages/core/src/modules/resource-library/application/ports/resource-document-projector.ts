import type { ResourceDocumentIssue } from "@workspace/resource-document"

export type ResourceDocumentProjection =
  | {
      readonly issues: readonly ResourceDocumentIssue[]
      readonly status: "invalid"
    }
  | {
      readonly markdown: string
      readonly nodeCount: number
      readonly snapshot: Uint8Array
      readonly status: "valid"
    }

export type ResourceDocumentProjectionResult =
  | {
      readonly kind: "completed"
      readonly projection: ResourceDocumentProjection
    }
  | {
      readonly elapsedMilliseconds: number
      readonly kind: "timeout"
    }
  | {
      readonly cause: unknown
      readonly kind: "failed"
    }

export type ResourceDocumentProjector = {
  readonly project: (input: {
    readonly snapshot: Uint8Array
    readonly timeoutMilliseconds: number
    readonly update: Uint8Array
  }) => Promise<ResourceDocumentProjectionResult>
}
