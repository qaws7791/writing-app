import type { DomainError } from "../types/index"

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

export function toApplicationError(error: DomainError): Error {
  switch (error.code) {
    case "VALIDATION_ERROR":
      return new ValidationError(error.message)
    case "NOT_FOUND":
      return new NotFoundError(error.message)
    case "FORBIDDEN":
      return new ForbiddenError(error.message)
    case "CONFLICT":
      return new ConflictError(error.message)
  }
}
