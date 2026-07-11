import type { LexicalEditor } from "lexical"

export type ResourceDocumentSyncState =
  | { readonly kind: "connecting"; readonly message: string }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "invalid"; readonly message: string }
  | { readonly kind: "readonly"; readonly message: string }
  | { readonly kind: "reconnecting"; readonly message: string }
  | { readonly kind: "saved"; readonly message: string }
  | { readonly kind: "syncing"; readonly message: string }

export type ResourceDocumentCollaborationClient = {
  readonly disconnect: () => void
  readonly retry: () => void
}

export type ConnectResourceDocumentCollaborationClientInput = {
  readonly documentId: string
  readonly editor: LexicalEditor
  readonly onSyncStateChange: (state: ResourceDocumentSyncState) => void
}

export type ResourceDocumentCollaborationConnector = (
  input: ConnectResourceDocumentCollaborationClientInput
) => ResourceDocumentCollaborationClient
