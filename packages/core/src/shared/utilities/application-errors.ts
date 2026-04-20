import type { DomainError } from "../error/index"

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ForbiddenError"
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnauthorizedError"
  }
}

export class ValidationError extends Error {
  readonly details?: ReadonlyArray<{ message: string; path: string }>

  constructor(
    message: string,
    details?: ReadonlyArray<{ message: string; path: string }>
  ) {
    super(message)
    this.name = "ValidationError"
    this.details = details
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ConflictError"
  }
}

type ApplicationErrorStatus = 400 | 401 | 403 | 404 | 409

export function toApplicationErrorStatus(
  error: unknown
): ApplicationErrorStatus | undefined {
  if (error instanceof ValidationError) return 400
  if (error instanceof UnauthorizedError) return 401
  if (error instanceof ForbiddenError) return 403
  if (error instanceof NotFoundError) return 404
  if (error instanceof ConflictError) return 409
  return undefined
}

export function toApplicationError(error: DomainError): Error {
  switch (error.code) {
    case "VALIDATION_ERROR":
      return new ValidationError(error.message)
    case "UNAUTHORIZED":
      return new UnauthorizedError(error.message)
    case "NOT_FOUND":
      return new NotFoundError(error.message)
    case "FORBIDDEN":
      return new ForbiddenError(error.message)
    case "CONFLICT":
      return new ConflictError(error.message)
    default: {
      const _exhaustive: never = error
      return _exhaustive
    }
  }
}
