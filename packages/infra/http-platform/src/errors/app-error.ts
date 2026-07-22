import type { ErrorResponse } from "#http-platform/errors/error-response"
import type { ErrorStatusCode } from "#http-platform/errors/status"

export type AppErrorInput = {
  status: ErrorStatusCode
  code: string
  message: string
  errors?: ErrorResponse["errors"]
  cause?: unknown
}

export class AppError extends Error {
  readonly status: ErrorStatusCode
  readonly code: string
  readonly errors?: ErrorResponse["errors"]
  override readonly cause?: unknown

  constructor(input: AppErrorInput) {
    super(input.message)

    this.name = "AppError"
    this.status = input.status
    this.code = input.code
    this.errors = input.errors
    this.cause = input.cause
  }
}
