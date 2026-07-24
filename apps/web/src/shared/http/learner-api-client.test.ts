import { describe, expect, it } from "vitest"
import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

import {
  isLearnerApiAuthenticationError,
  isLearnerApiNetworkError,
  readLearnerApiErrorCode,
  readLearnerApiRetryAfterSeconds,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"

describe("learner API client boundary", () => {
  it("generated 성공 값을 변경하지 않는다", async () => {
    await expect(
      settleLearnerApiRequest(Promise.resolve({ id: "course-1" }))
    ).resolves.toEqual({
      status: "ok",
      value: { id: "course-1" },
    })
  })

  it("401 canonical 오류를 인증 실패로 유지한다", async () => {
    const error = new GeneratedApiClientError({
      error: {
        code: "UNAUTHENTICATED",
        message: "로그인이 필요합니다.",
        requestId: "request-1",
      },
      kind: "http",
      retryAfterSeconds: null,
      status: 401,
    })

    const result = await settleLearnerApiRequest(Promise.reject(error))

    expect(result).toEqual({ error, status: "error" })
    expect(isLearnerApiAuthenticationError(error)).toBe(true)
    expect(readLearnerApiErrorCode(error)).toBe("UNAUTHENTICATED")
    expect(readLearnerApiRetryAfterSeconds(error)).toBeNull()
  })

  it("network와 contract 오류를 구분한다", () => {
    const networkError = new GeneratedApiClientError({
      kind: "network",
      method: "GET",
      url: "https://api.example.test/api/profile",
    })
    const contractError = new GeneratedApiClientError({
      kind: "contract",
      reason: "invalid-json-response",
      status: 200,
    })

    expect(isLearnerApiNetworkError(networkError)).toBe(true)
    expect(readLearnerApiErrorCode(networkError)).toBe("NETWORK_ERROR")
    expect(readLearnerApiErrorCode(contractError)).toBe("CONTRACT_ERROR")
  })

  it("generated client 밖의 예상하지 못한 오류는 숨기지 않는다", async () => {
    const unexpected = new Error("unexpected")

    await expect(
      settleLearnerApiRequest(Promise.reject(unexpected))
    ).rejects.toBe(unexpected)
  })
})
