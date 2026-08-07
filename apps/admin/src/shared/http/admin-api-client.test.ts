import { describe, expect, it } from "vitest"

import {
  isAdminRequestAuthenticationError,
  settleAdminApiRequest,
} from "@/shared/http/admin-api-client"
import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

describe("admin generated API 경계", () => {
  it.each([
    { authenticated: true, code: "UNAUTHORIZED", status: 401 },
    { authenticated: true, code: "FORBIDDEN", status: 403 },
  ] as const)(
    "$status HTTP 오류의 canonical code와 retry 정보를 보존한다",
    async ({ code, status }) => {
      await expect(
        settleAdminApiRequest(rejectWithHttpError(code, status))
      ).resolves.toEqual({
        error: {
          code,
          kind: "http",
          message: `${status} 오류`,
          requestId: `request-${status}`,
          retryAfterSeconds: null,
          status,
        },
        status: "error",
      })
    }
  )

  it.each([
    { authenticated: true, code: "UNAUTHORIZED", status: 401 },
    { authenticated: true, code: "FORBIDDEN", status: 403 },
    { authenticated: false, code: "CONTENT_CONFLICT", status: 409 },
    { authenticated: false, code: "RATE_LIMITED", status: 429 },
  ] as const)(
    "$status 오류를 재인증이 필요한 오류로 분류할지 판정한다",
    async ({ authenticated, code, status }) => {
      const result = await settleAdminApiRequest(
        rejectWithHttpError(code, status)
      )

      expect(
        result.status === "error" &&
          isAdminRequestAuthenticationError(result.error)
      ).toBe(authenticated)
    }
  )

  it.each([
    {
      code: "NETWORK_ERROR",
      detail: {
        kind: "network",
        method: "GET",
        url: "https://api.example.test/api/admin/dashboard",
      },
      kind: "network",
      message: "네트워크 연결을 확인해 주세요.",
      status: null,
    },
    {
      code: "CONTRACT_ERROR",
      detail: {
        kind: "contract",
        reason: "invalid-json-response",
        status: 200,
      },
      kind: "contract",
      message: "API 계약을 해석할 수 없습니다.",
      status: 200,
    },
  ] as const)(
    "$kind 오류를 직렬화 가능한 app 오류로 변환한다",
    async ({ code, detail, kind, message, status }) => {
      await expect(
        settleAdminApiRequest(
          Promise.reject(new GeneratedApiClientError(detail))
        )
      ).resolves.toEqual({
        error: {
          code,
          kind,
          message,
          requestId: "client",
          retryAfterSeconds: null,
          status,
        },
        status: "error",
      })
    }
  )

  it("generated client 밖의 예상하지 못한 오류는 숨기지 않는다", async () => {
    const unexpected = new Error("unexpected")

    await expect(
      settleAdminApiRequest(Promise.reject(unexpected))
    ).rejects.toBe(unexpected)
  })
})

function rejectWithHttpError(code: string, status: number): Promise<never> {
  return Promise.reject(
    new GeneratedApiClientError({
      error: {
        code,
        message: `${status} 오류`,
        requestId: `request-${status}`,
      },
      kind: "http",
      retryAfterSeconds: status === 429 ? 30 : null,
      status,
    })
  )
}
