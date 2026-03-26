import { describe, expect, it } from "vitest"

import {
  createConflictError,
  createForbiddenError,
  createNotFoundError,
  createValidationError,
} from "../error/index"
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
      createValidationError("잘못된 요청", "writing")
    )

    expect(error).toBeInstanceOf(ValidationError)
    expect(error.message).toBe("잘못된 요청")
  })

  it("maps not found, forbidden, and conflict errors to matching classes", () => {
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
