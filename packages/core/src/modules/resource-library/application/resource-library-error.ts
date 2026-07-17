import type { ResourceDocumentIssue } from "@workspace/resource-document/resource-markdown"

export type ResourceTreeCommandRejection =
  | { readonly kind: "not-found" }
  | { readonly kind: "parent-not-found" }
  | { readonly kind: "name-conflict" }
  | {
      readonly kind: "invalid-name"
      readonly reason: "empty" | "invalid-character" | "too-long"
    }
  | { readonly kind: "cycle" }
  | { readonly kind: "depth-limit" }
  | { readonly kind: "node-limit" }

export type ResourceDocumentInvalidMarkdown = {
  readonly issues: readonly ResourceDocumentIssue[]
  readonly kind: "invalid-markdown"
}

export type ResourceDocumentInputRejection =
  | ResourceDocumentInvalidMarkdown
  | { readonly kind: "invalid-file-name" }

export type ResourceLibraryRejection =
  | ResourceDocumentInputRejection
  | ResourceTreeCommandRejection

export type ResourceTreeCommandResult<TValue> =
  | { readonly kind: "ok"; readonly value: TValue }
  | ResourceTreeCommandRejection
