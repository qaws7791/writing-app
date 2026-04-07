import type { WritingId } from "../../shared/brand/index"
import {
  createForbiddenError,
  createNotFoundError,
  createValidationError,
  type ForbiddenError,
  type NotFoundError,
  type ValidationError,
} from "../../shared/error/index"

export type WritingNotFoundError = NotFoundError & {
  readonly entity: "writing"
  readonly id?: WritingId
}

export type WritingForbiddenError = ForbiddenError & {
  readonly resource: "writing"
}

export type WritingValidationError = ValidationError & {
  readonly field: "writing"
}

export type WritingModuleError =
  | WritingNotFoundError
  | WritingForbiddenError
  | WritingValidationError

export function writingNotFound(
  message: string,
  writingId?: WritingId
): WritingNotFoundError {
  return {
    ...createNotFoundError(message, { entity: "writing", id: writingId }),
    entity: "writing",
    id: writingId,
  }
}

export function writingForbidden(message: string): WritingForbiddenError {
  return {
    ...createForbiddenError(message, { resource: "writing" }),
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
