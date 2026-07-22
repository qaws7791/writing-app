import type { ResourceDocument } from "#resource-library/domain/resource-document"

type ResourceNotFoundError = Readonly<{
  kind: "resource-not-found"
  target: "asset" | "document" | "node" | "parent"
}>

type ResourceForbiddenError = Readonly<{
  kind: "resource-forbidden"
}>

type ResourceValidationError = Readonly<{
  issues?: readonly Readonly<{ code: string }>[]
  kind: "resource-validation"
  reason:
    | "alt-text-empty"
    | "alt-text-too-long"
    | "depth-limit"
    | "file-name-invalid"
    | "image-empty"
    | "image-too-large"
    | "markdown-invalid"
    | "name-empty"
    | "name-invalid-character"
    | "name-too-long"
    | "node-limit"
    | "unsupported-image"
}>

export type ResourceConflictError = Readonly<{
  document?: ResourceDocument
  kind: "resource-conflict"
  reason: "move-cycle" | "name-conflict" | "stale-version"
}>

type ResourceStorageFailure = Readonly<{
  compensation: "failed" | "not-required" | "succeeded"
  kind: "resource-storage-failure"
  operation: "delete" | "upload"
  retryable: boolean
}>

type ResourcePersistenceFailure = Readonly<{
  kind: "resource-persistence-failure"
  operation:
    | "complete-delete"
    | "import-document"
    | "prepare-delete"
    | "register-asset"
    | "save-document"
}>

export type ResourceLibraryError =
  | ResourceConflictError
  | ResourceForbiddenError
  | ResourceNotFoundError
  | ResourcePersistenceFailure
  | ResourceStorageFailure
  | ResourceValidationError
