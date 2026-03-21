import type { DraftId, PromptId, UserId } from "../brand/index"

type EntityId = DraftId | PromptId | UserId | number | string

export type ValidationError = {
  readonly code: "VALIDATION_ERROR"
  readonly field?: string
  readonly message: string
}

export type NotFoundError = {
  readonly code: "NOT_FOUND"
  readonly entity?: string
  readonly id?: EntityId
  readonly message: string
}

export type ForbiddenError = {
  readonly code: "FORBIDDEN"
  readonly ownerId?: UserId
  readonly resource?: string
  readonly message: string
}

export type ConflictError = {
  readonly code: "CONFLICT"
  readonly entity?: string
  readonly message: string
}

export type DomainError =
  | ConflictError
  | ForbiddenError
  | NotFoundError
  | ValidationError

export function createValidationError(
  message: string,
  field?: string
): ValidationError {
  return {
    code: "VALIDATION_ERROR",
    field,
    message,
  }
}

export function createNotFoundError(
  message: string,
  details: {
    entity?: string
    id?: EntityId
  } = {}
): NotFoundError {
  return {
    code: "NOT_FOUND",
    entity: details.entity,
    id: details.id,
    message,
  }
}

export function createForbiddenError(
  message: string,
  details: {
    ownerId?: UserId
    resource?: string
  } = {}
): ForbiddenError {
  return {
    code: "FORBIDDEN",
    ownerId: details.ownerId,
    resource: details.resource,
    message,
  }
}

export function createConflictError(
  message: string,
  entity?: string
): ConflictError {
  return {
    code: "CONFLICT",
    entity,
    message,
  }
}

export function toHttpStatus(error: DomainError): 400 | 403 | 404 | 409 {
  switch (error.code) {
    case "VALIDATION_ERROR":
      return 400
    case "FORBIDDEN":
      return 403
    case "NOT_FOUND":
      return 404
    case "CONFLICT":
      return 409
  }
}
