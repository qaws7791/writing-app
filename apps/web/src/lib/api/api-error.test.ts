import { describe, expect, it } from "vitest"

import { apiErrorFromResponseBody, networkApiError } from "@/lib/api/api-error"

describe("api-error", () => {
  it("maps backend unauthorized responses", () => {
    expect(
      apiErrorFromResponseBody(401, {
        code: "unauthorized",
        message: "로그인이 필요합니다.",
      })
    ).toEqual({
      code: "unauthorized",
      message: "로그인이 필요합니다.",
    })
  })

  it("maps unknown server responses to unavailable", () => {
    expect(apiErrorFromResponseBody(503, { message: "down" })).toEqual({
      code: "unavailable",
      message: "서버를 사용할 수 없습니다.",
    })
  })

  it("rejects malformed backend error contracts", () => {
    expect(
      apiErrorFromResponseBody(401, {
        code: "unauthorized",
        message: 401,
      })
    ).toEqual({
      code: "contract-error",
      message: "서버 응답이 예상한 계약과 일치하지 않습니다.",
    })
  })

  it("maps fetch failures to network errors", () => {
    expect(networkApiError()).toEqual({
      code: "network-error",
      message: "네트워크 요청에 실패했습니다.",
    })
  })
})
