import {
  AppError,
  assertExhaustiveHttpResult,
} from "@workspace/http-platform/errors"

import type { IdentityError } from "#identity/domain/identity-error"

export function mapIdentityError(error: IdentityError): AppError {
  switch (error.kind) {
    case "identity-deletion-marker-failed":
      return new AppError({
        code: "IDENTITY_DELETION_MARKER_FAILED",
        message: "Identity deletion marker write failed",
        status: 503,
      })
    case "identity-deleted":
      return new AppError({
        code: "FORBIDDEN",
        message: "Forbidden",
        status: 403,
      })
    case "identity-not-found":
      return new AppError({
        code: "NOT_FOUND",
        message: "Not Found",
        status: 404,
      })
    case "identity-conflict":
      return new AppError({
        code: "IDENTITY_CONFLICT",
        message: "Identity update conflict",
        status: 409,
      })
    case "identity-invalid-status-transition":
      return new AppError({
        code: "INVALID_STATUS_TRANSITION",
        message: "Identity transition is not allowed",
        status: 409,
      })
    case "identity-invalid-profile":
      return new AppError({
        code: "VALIDATION_FAILED",
        message: "Identity profile is invalid",
        status: 400,
      })
    case "identity-session-revocation-failed":
      return new AppError({
        code: "IDENTITY_SESSION_REVOCATION_FAILED",
        message: "Identity session revocation failed",
        status: 503,
      })
  }

  return assertExhaustiveHttpResult(error)
}
