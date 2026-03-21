import { describe, expect, it } from "vitest"

import {
  createConflictError,
  createForbiddenError,
  createNotFoundError,
  createValidationError,
} from "../types/index"
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  toApplicationError,
} from "./index"

describe("toApplicationError", () => {
  it("maps validation errors to ValidationError instances", () => {
    const error = toApplicationError(
      createValidationError("잘못된 요청", "draft")
    )

    expect(error).toBeInstanceOf(ValidationError)
    expect(error.message).toBe("잘못된 요청")
  })

  it("maps not found, forbidden, and conflict errors to matching classes", () => {
    expect(
      toApplicationError(
        createNotFoundError("초안을 찾을 수 없습니다.", {
          entity: "draft",
          id: "1",
        })
      )
    ).toBeInstanceOf(NotFoundError)

    expect(
      toApplicationError(
        createForbiddenError("접근할 수 없습니다.", {
          resource: "draft",
        })
      )
    ).toBeInstanceOf(ForbiddenError)

    expect(
      toApplicationError(createConflictError("이미 존재합니다.", "prompt"))
    ).toBeInstanceOf(ConflictError)
  })
})
