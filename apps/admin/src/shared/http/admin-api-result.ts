import type { HttpApiFailure, HttpApiResult } from "@workspace/http-client"

import type { AdminApiError } from "@/shared/http/admin-api-error"

export type AdminApiResult<TValue> = HttpApiResult<TValue, AdminApiError>

export function createAdminActionError(
  code: "invalid-request" | "unauthorized"
): HttpApiFailure<AdminApiError> {
  return {
    error: {
      code,
      message:
        code === "unauthorized"
          ? "관리자 로그인이 필요합니다."
          : "요청 내용을 확인해 주세요.",
    },
    status: "error",
  }
}
