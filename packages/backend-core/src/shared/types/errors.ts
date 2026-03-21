/**
 * Common domain error types.
 * Uses discriminated unions instead of boolean flags.
 */

export type DomainError = {
  kind: string
  message: string
}

export type ValidationError = DomainError & {
  kind: "validation-error"
}

export function createValidationError(message: string): ValidationError {
  return {
    kind: "validation-error",
    message,
  }
}

export type NotFoundError = DomainError & {
  kind: "not-found"
}

export function createNotFoundError(message: string): NotFoundError {
  return {
    kind: "not-found",
    message,
  }
}

export type ForbiddenError = DomainError & {
  kind: "forbidden"
}

export function createForbiddenError(message: string): ForbiddenError {
  return {
    kind: "forbidden",
    message,
  }
}

export type ConflictError = DomainError & {
  kind: "conflict"
}

export function createConflictError(message: string): ConflictError {
  return {
    kind: "conflict",
    message,
  }
}
