import { describe, expect, it } from "vitest"

import { adminApiErrorSchema } from "#contracts/operations/admin-api-error"

describe("관리자 공개 오류 계약", () => {
  it("공개 code, message와 validation 위반만 허용한다", () => {
    expect(
      adminApiErrorSchema.parse({
        code: "VALIDATION_FAILED",
        errors: [{ code: "too_small", message: "필수값입니다.", path: "name" }],
        message: "요청 값을 확인해 주세요.",
      })
    ).toEqual({
      code: "VALIDATION_FAILED",
      errors: [{ code: "too_small", message: "필수값입니다.", path: "name" }],
      message: "요청 값을 확인해 주세요.",
    })
  })

  it.each([
    "cause",
    "credential",
    "email",
    "password",
    "sql",
    "stack",
    "token",
  ])("민감한 내부 필드 %s를 거부한다", (field) => {
    expect(
      adminApiErrorSchema.safeParse({
        code: "INTERNAL_SERVER_ERROR",
        message: "요청을 처리할 수 없습니다.",
        [field]: "sensitive",
      }).success
    ).toBe(false)
  })
})
