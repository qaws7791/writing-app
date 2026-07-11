import { describe, expect, it } from "vitest"

import { toApiError } from "@/lib/api/api-error"

describe("API 오류 매핑", () => {
  it("서버 error code를 화면용 오류로 변환한다", () => {
    expect(
      toApiError(401, {
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      })
    ).toEqual({
      code: "unauthorized",
      message: "로그인이 필요합니다.",
      status: 401,
    })
  })

  it("검증과 HTTP 예외는 invalid-request 화면 오류로 변환한다", () => {
    expect(
      toApiError(400, {
        code: "VALIDATION_FAILED",
        message: "Request validation failed",
      })
    ).toEqual({
      code: "invalid-request",
      message: "요청 내용을 확인해 주세요.",
      status: 400,
    })

    expect(
      toApiError(400, {
        code: "HTTP_EXCEPTION",
        message: "Bad Request",
      })
    ).toEqual({
      code: "invalid-request",
      message: "요청 내용을 확인해 주세요.",
      status: 400,
    })
  })

  it("stale 진행 저장 conflict를 최신 진행 재조회 안내로 변환한다", () => {
    expect(
      toApiError(409, {
        code: "PROGRESS_CONFLICT",
        message: "Lesson progress is stale",
      })
    ).toEqual({
      code: "progress-conflict",
      message: "다른 요청에서 학습 진행이 갱신되었습니다.",
      status: 409,
    })
  })

  it("알 수 없는 응답은 contract-error로 변환한다", () => {
    expect(toApiError(500, { message: "boom" })).toEqual({
      code: "contract-error",
      message: "API 응답을 해석할 수 없습니다.",
      status: 500,
    })
  })
})
