import { describe, expect, it } from "vitest"

import {
  createConflictError,
  createForbiddenError,
  createNotFoundError,
  createUnauthorizedError,
  createValidationError,
} from "../error/index"
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  toApplicationError,
  toApplicationErrorStatus,
} from "./index"

describe("toApplicationError", () => {
  it("maps validation errors to ValidationError instances", () => {
    const error = toApplicationError(
      createValidationError("잘못된 요청", "writing")
    )

    expect(error).toBeInstanceOf(ValidationError)
    expect(error.message).toBe("잘못된 요청")
  })

  it("maps unauthorized, not found, forbidden, and conflict errors to matching classes", () => {
    expect(
      toApplicationError(
        createUnauthorizedError("로그인이 필요합니다.", {
          reason: "authentication_required",
        })
      )
    ).toBeInstanceOf(UnauthorizedError)

    expect(
      toApplicationError(
        createNotFoundError("글을 찾을 수 없습니다.", {
          entity: "writing",
          id: "1",
        })
      )
    ).toBeInstanceOf(NotFoundError)

    expect(
      toApplicationError(
        createForbiddenError("접근할 수 없습니다.", {
          resource: "writing",
        })
      )
    ).toBeInstanceOf(ForbiddenError)

    expect(
      toApplicationError(createConflictError("이미 존재합니다.", "prompt"))
    ).toBeInstanceOf(ConflictError)
  })
})

describe("toApplicationErrorStatus", () => {
  it("maps runtime application errors to matching HTTP statuses", () => {
    expect(toApplicationErrorStatus(new ValidationError("잘못된 요청"))).toBe(
      400
    )
    expect(
      toApplicationErrorStatus(new UnauthorizedError("로그인이 필요합니다."))
    ).toBe(401)
    expect(
      toApplicationErrorStatus(new ForbiddenError("접근할 수 없습니다."))
    ).toBe(403)
    expect(toApplicationErrorStatus(new NotFoundError("없음"))).toBe(404)
    expect(toApplicationErrorStatus(new ConflictError("충돌"))).toBe(409)
  })

  it("returns undefined for non-application errors", () => {
    expect(toApplicationErrorStatus(new Error("boom"))).toBeUndefined()
  })
})
