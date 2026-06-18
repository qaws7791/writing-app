export type AppErrorKind = "domain" | "infrastructure" | "validation"

export type AppErrorCode =
  | "AI_FEEDBACK_PROVIDER_UNAVAILABLE"
  | "AUTHENTICATION_REQUIRED"
  | "CONTENT_NOT_FOUND"
  | "INFRASTRUCTURE_FAILURE"
  | "INVALID_REQUEST"
  | "LESSON_NOT_FOUND"
  | "PERMISSION_DENIED"

export type AppError = {
  readonly cause?: unknown
  readonly code: AppErrorCode
  readonly kind: AppErrorKind
  readonly message: string
}

export type DomainError = AppError & {
  readonly kind: "domain"
}

export type InfrastructureError = AppError & {
  readonly kind: "infrastructure"
}

export type ValidationError = AppError & {
  readonly kind: "validation"
}

export function domainError(input: {
  readonly code: AppErrorCode
  readonly message: string
}): DomainError {
  return {
    code: input.code,
    kind: "domain",
    message: input.message,
  }
}

export function infrastructureError(input: {
  readonly cause?: unknown
  readonly code?: AppErrorCode
  readonly message: string
}): InfrastructureError {
  return {
    cause: input.cause,
    code: input.code ?? "INFRASTRUCTURE_FAILURE",
    kind: "infrastructure",
    message: input.message,
  }
}

export function validationError(input: {
  readonly code?: AppErrorCode
  readonly message: string
}): ValidationError {
  return {
    code: input.code ?? "INVALID_REQUEST",
    kind: "validation",
    message: input.message,
  }
}
