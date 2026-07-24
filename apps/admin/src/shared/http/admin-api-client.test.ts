import { describe, expect, it } from "vitest"

import {
  invalidAdminRequestFailure,
  isAdminRequestAuthenticationError,
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

describe("admin generated API 경계", () => {
  it("generated 성공 값을 변경하지 않는다", async () => {
    await expect(
      settleAdminApiRequest(Promise.resolve({ totalUsers: 12 }))
    ).resolves.toEqual({
      status: "ok",
      value: { totalUsers: 12 },
    })
  })

  it.each([
    { authenticated: true, code: "UNAUTHORIZED", status: 401 },
    { authenticated: true, code: "FORBIDDEN", status: 403 },
    { authenticated: false, code: "CONTENT_CONFLICT", status: 409 },
    { authenticated: false, code: "RATE_LIMITED", status: 429 },
  ] as const)(
    "$status HTTP 오류의 canonical code와 retry 정보를 보존한다",
    async ({ authenticated, code, status }) => {
      const result = await settleAdminApiRequest(
        Promise.reject(
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
      )

      expect(result).toEqual({
        error: {
          code,
          kind: "http",
          message: `${status} 오류`,
          requestId: `request-${status}`,
          retryAfterSeconds: status === 429 ? 30 : null,
          status,
        },
        status: "error",
      })
      if (result.status === "error") {
        expect(isAdminRequestAuthenticationError(result.error)).toBe(
          authenticated
        )
      }
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

  it("Server Action의 입력·세션 실패도 같은 오류 shape을 사용한다", () => {
    expect(invalidAdminRequestFailure()).toMatchObject({
      error: { code: "VALIDATION_FAILED", status: 400 },
      status: "error",
    })
    expect(unauthenticatedAdminRequestFailure()).toMatchObject({
      error: { code: "UNAUTHORIZED", status: 401 },
      status: "error",
    })
  })

  it("generated client 밖의 예상하지 못한 오류는 숨기지 않는다", async () => {
    const unexpected = new Error("unexpected")

    await expect(
      settleAdminApiRequest(Promise.reject(unexpected))
    ).rejects.toBe(unexpected)
  })
})
