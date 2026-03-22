/**
 * @deprecated Import from "../error/index" for errors, use neverthrow for Result.
 */
export type {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "./errors"
export {
  createConflictError,
  createForbiddenError,
  createNotFoundError,
  createValidationError,
  toHttpStatus,
} from "./errors"
export type { Result } from "./result"
export { ok, err } from "./result"
