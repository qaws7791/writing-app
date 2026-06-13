import { describe, expect, it } from "vitest"

import { toApiError } from "@/lib/api/api-error"

describe("API 오류 매핑", () => {
  it("서버 error code를 화면용 오류로 변환한다", () => {
    expect(
      toApiError(401, {
        error: {
          code: "unauthorized",
        },
      })
    ).toEqual({
      code: "unauthorized",
      message: "로그인이 필요합니다.",
      status: 401,
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
