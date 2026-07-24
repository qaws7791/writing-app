import { jsonResponse } from "@workspace/http-platform/openapi"
import { apiErrorSchema } from "@workspace/contracts/api-error"

export function contentErrorJsonResponse(description: string) {
  return jsonResponse(description, apiErrorSchema)
}

export function contentAuthenticatedResponses(
  successResponse: ReturnType<typeof jsonResponse>
) {
  return {
    200: successResponse,
    401: contentErrorJsonResponse("관리자 인증이 필요합니다."),
  }
}
