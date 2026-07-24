import type { ErrorResponse } from "#http-platform/errors/error-response"
import type { ErrorStatusCode } from "#http-platform/errors/status"

export type AppErrorInput = {
  status: ErrorStatusCode
  code: string
  message: string
  headers?: Readonly<Record<string, string>>
  violations?: ErrorResponse["violations"]
  cause?: unknown
}

export class AppError extends Error {
  readonly status: ErrorStatusCode
  readonly code: string
  readonly headers?: Readonly<Record<string, string>>
  readonly violations?: ErrorResponse["violations"]
  override readonly cause?: unknown

  constructor(input: AppErrorInput) {
    super(input.message)

    this.name = "AppError"
    this.status = input.status
    this.code = input.code
    this.headers = input.headers
    this.violations = input.violations
    this.cause = input.cause
  }
}
