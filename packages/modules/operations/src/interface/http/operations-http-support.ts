import { AppError } from "@workspace/http-platform/errors"
import { apiErrorSchema } from "@workspace/contracts/api-error"
import { jsonResponse } from "@workspace/http-platform/openapi"

import type { OperationsError } from "#operations/domain/operations-error"
export function operationsErrorResponse(description: string) {
  return jsonResponse(description, apiErrorSchema)
}

export function operationsAuthenticatedResponses(
  successResponse: ReturnType<typeof jsonResponse>
) {
  return {
    200: successResponse,
    401: operationsErrorResponse("관리자 인증이 필요합니다."),
    403: operationsErrorResponse("관리자 권한이 필요합니다."),
  }
}

export function mapOperationsError(error: OperationsError): AppError {
  return new AppError({
    cause: error,
    code: "OPERATIONS_REPORTING_UNAVAILABLE",
    message: `${error.query} reporting is unavailable`,
    status: 503,
  })
}
