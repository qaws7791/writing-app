import type { DraftId, PromptId, UserId } from "../../../shared/brand/index"
import {
  createForbiddenError,
  createNotFoundError,
  createValidationError,
  type ForbiddenError,
  type NotFoundError,
  type ValidationError,
} from "../../../shared/types/index"

export type DraftNotFoundError = NotFoundError & {
  readonly entity: "draft"
  readonly id?: DraftId
}

export type DraftForbiddenError = ForbiddenError & {
  readonly ownerId: UserId
  readonly resource: "draft"
}

export type DraftValidationError = ValidationError & {
  readonly field: "draft"
}

export type PromptReferenceNotFoundError = NotFoundError & {
  readonly entity: "prompt"
  readonly id?: PromptId
}

export type DraftModuleError =
  | DraftForbiddenError
  | DraftNotFoundError
  | DraftValidationError
  | PromptReferenceNotFoundError

export function draftNotFound(
  message: string,
  draftId?: DraftId
): DraftNotFoundError {
  return {
    ...createNotFoundError(message, {
      entity: "draft",
      id: draftId,
    }),
    entity: "draft",
    id: draftId,
  }
}

export function draftForbidden(
  message: string,
  ownerId: UserId
): DraftForbiddenError {
  return {
    ...createForbiddenError(message, {
      ownerId,
      resource: "draft",
    }),
    ownerId,
    resource: "draft",
  }
}

export function draftValidationFailed(message: string): DraftValidationError {
  return {
    ...createValidationError(message, "draft"),
    field: "draft",
  }
}

export function promptNotFound(
  message: string,
  promptId?: PromptId
): PromptReferenceNotFoundError {
  return {
    ...createNotFoundError(message, {
      entity: "prompt",
      id: promptId,
    }),
    entity: "prompt",
    id: promptId,
  }
}
