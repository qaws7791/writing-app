import { describe, expect, it } from "vitest"

import { toApiError } from "@/shared/http/api-error"

describe("API 오류 계약", () => {
  it("canonical 서버 오류의 code와 message를 그대로 사용한다", () => {
    expect(
      toApiError(401, {
        code: "UNAUTHENTICATED",
        message: "로그인이 필요합니다.",
        requestId: "request-1",
      })
    ).toEqual({
      code: "UNAUTHENTICATED",
      message: "로그인이 필요합니다.",
      requestId: "request-1",
      status: 401,
    })
  })

  it("검증 오류의 violations를 보존한다", () => {
    expect(
      toApiError(400, {
        code: "VALIDATION_ERROR",
        message: "요청 내용을 확인해 주세요.",
        requestId: "request-2",
        violations: [{ message: "필수 값입니다.", path: "stepId" }],
      })
    ).toEqual({
      code: "VALIDATION_ERROR",
      message: "요청 내용을 확인해 주세요.",
      requestId: "request-2",
      status: 400,
      violations: [{ message: "필수 값입니다.", path: "stepId" }],
    })
  })

  it("알 수 없는 응답은 CONTRACT_ERROR로 변환한다", () => {
    expect(toApiError(500, { message: "boom" })).toEqual({
      code: "CONTRACT_ERROR",
      message: "API 응답을 해석할 수 없습니다.",
      status: 500,
    })
  })
})
