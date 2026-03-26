import { describe, expect, it } from "vitest"

import {
  createConflictError,
  createForbiddenError,
  createNotFoundError,
  createValidationError,
  toHttpStatus,
} from "./domain-error"

describe("toHttpStatus", () => {
  it("VALIDATION_ERROR → 400", () => {
    expect(toHttpStatus(createValidationError("잘못된 요청"))).toBe(400)
  })

  it("FORBIDDEN → 403", () => {
    expect(toHttpStatus(createForbiddenError("접근 불가"))).toBe(403)
  })

  it("NOT_FOUND → 404", () => {
    expect(toHttpStatus(createNotFoundError("없음"))).toBe(404)
  })

  it("CONFLICT → 409", () => {
    expect(toHttpStatus(createConflictError("충돌"))).toBe(409)
  })
})

describe("createValidationError", () => {
  it("field 포함 ValidationError를 생성한다", () => {
    const error = createValidationError("잘못된 요청", "title")

    expect(error).toMatchObject({
      code: "VALIDATION_ERROR",
      field: "title",
      message: "잘못된 요청",
    })
  })
})

describe("createNotFoundError", () => {
  it("entity 정보를 포함한다", () => {
    const error = createNotFoundError("없음", { entity: "writing", id: "123" })

    expect(error).toMatchObject({
      code: "NOT_FOUND",
      entity: "writing",
      id: "123",
    })
  })
})

describe("createForbiddenError", () => {
  it("resource 정보를 포함한다", () => {
    const error = createForbiddenError("접근 불가", { resource: "writing" })

    expect(error).toMatchObject({
      code: "FORBIDDEN",
      resource: "writing",
    })
  })
})

describe("createConflictError", () => {
  it("entity 정보를 포함한다", () => {
    const error = createConflictError("충돌", "prompt")

    expect(error).toMatchObject({
      code: "CONFLICT",
      entity: "prompt",
    })
  })
})
