import { apiErrorSchema, type ApiError } from "@workspace/contracts/api-error"
import { HttpResponse } from "msw"

export type ApiErrorFixtureStatus = 401 | 409 | 429 | 500

export function createApiErrorFixture(
  status: ApiErrorFixtureStatus,
  overrides: Readonly<Partial<ApiError>> = {}
): ApiError {
  return apiErrorSchema.parse({
    code: overrides.code ?? `TEST_HTTP_${status}`,
    message: overrides.message ?? `HTTP ${status} 테스트 오류입니다.`,
    requestId: overrides.requestId ?? `fixture-request-${status}`,
    ...(overrides.violations === undefined
      ? {}
      : { violations: overrides.violations }),
  })
}

export function throwMswNetworkErrorFixture(): never {
  throw HttpResponse.error()
}
