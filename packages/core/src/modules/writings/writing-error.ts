import type { DraftId, UserId } from "../../shared/brand/index"
import {
  createConflictError,
  createForbiddenError,
  createNotFoundError,
  createValidationError,
  type ConflictError,
  type ForbiddenError,
  type NotFoundError,
  type ValidationError,
} from "../../shared/error/index"

export type WritingNotFoundError = NotFoundError & {
  readonly entity: "writing"
  readonly id?: DraftId
}

export type WritingForbiddenError = ForbiddenError & {
  readonly ownerId: UserId
  readonly resource: "writing"
}

export type WritingValidationError = ValidationError & {
  readonly field: "writing"
}

export type WritingConflictError = ConflictError & {
  readonly entity: "writing"
  readonly serverVersion: number
}

export type WritingModuleError =
  | WritingNotFoundError
  | WritingForbiddenError
  | WritingValidationError
  | WritingConflictError

export function writingNotFound(
  message: string,
  draftId?: DraftId
): WritingNotFoundError {
  return {
    ...createNotFoundError(message, { entity: "writing", id: draftId }),
    entity: "writing",
    id: draftId,
  }
}

export function writingForbidden(
  message: string,
  ownerId: UserId
): WritingForbiddenError {
  return {
    ...createForbiddenError(message, { ownerId, resource: "writing" }),
    ownerId,
    resource: "writing",
  }
}

export function writingValidationFailed(
  message: string
): WritingValidationError {
  return {
    ...createValidationError(message, "writing"),
    field: "writing",
  }
}

export function writingConflict(
  message: string,
  serverVersion: number
): WritingConflictError {
  return {
    ...createConflictError(message, "writing"),
    entity: "writing",
    serverVersion,
  }
}
