/**
 * Draft module error types.
 * Represents failures in draft operations using discriminated unions.
 */

export type DraftModuleError =
  | { kind: "draft-not-found"; message: string }
  | { kind: "draft-forbidden"; message: string; ownerId: string }
  | { kind: "draft-validation-failed"; message: string }
  | { kind: "prompt-not-found"; message: string }

export function draftNotFound(message: string): DraftModuleError {
  return { kind: "draft-not-found", message }
}

export function draftForbidden(
  message: string,
  ownerId: string
): DraftModuleError {
  return { kind: "draft-forbidden", message, ownerId }
}

export function draftValidationFailed(message: string): DraftModuleError {
  return { kind: "draft-validation-failed", message }
}

export function promptNotFound(message: string): DraftModuleError {
  return { kind: "prompt-not-found", message }
}
