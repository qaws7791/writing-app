/**
 * Error classes for backward compatibility with @workspace/application.
 * These are the exception-based errors that the API layer expects.
 *
 * TODO: Migrate API error handling to result-based errors instead of exceptions.
 */

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
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}
