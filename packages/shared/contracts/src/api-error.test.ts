import { describe, expect, it } from "vitest"

import { apiErrorSchema, parseApiError } from "#contracts/api-error"

describe("canonical API error", () => {
  it("status 없이 request ID와 optional violations를 검증한다", () => {
    expect(
      apiErrorSchema.parse({
        code: "VALIDATION_FAILED",
        message: "요청 내용을 확인해 주세요.",
        requestId: "request-1",
        violations: [
          {
            code: "too_small",
            message: "필수 값입니다.",
            path: "body.name",
          },
        ],
      })
    ).not.toHaveProperty("status")
  })

  it("알 수 없는 client response를 CONTRACT_ERROR 하나로 수렴한다", () => {
    expect(parseApiError({ legacy: true }, "request-2")).toEqual({
      code: "CONTRACT_ERROR",
      message: "API 응답을 해석할 수 없습니다.",
      requestId: "request-2",
    })
  })

  it("공개 오류에서 계약 밖 내부 필드를 거부한다", () => {
    expect(
      apiErrorSchema.safeParse({
        code: "INTERNAL_SERVER_ERROR",
        message: "요청을 처리할 수 없습니다.",
        requestId: "request-3",
        cause: "sensitive",
      }).success
    ).toBe(false)
  })
})
