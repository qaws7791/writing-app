export { AppError } from "@/http/platform/errors/app-error"
export { ErrorResponseSchema } from "@/http/platform/errors/error-response"
export type { ErrorResponse } from "@/http/platform/errors/error-response"
export { createErrorHandler } from "@/http/platform/errors/error-handler"
export type {
  InternalErrorLogEvent,
  InternalErrorLogger,
} from "@/http/platform/errors/error-handler"
export { createNotFoundHandler } from "@/http/platform/errors/not-found-handler"
export { HTTP_ERROR_MESSAGES } from "@/http/platform/errors/status"
export type { ErrorStatusCode } from "@/http/platform/errors/status"
export { createValidationErrorHook } from "@/http/platform/errors/validation-error-hook"
