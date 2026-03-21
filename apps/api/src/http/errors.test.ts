import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@workspace/core"

import { toErrorResponse } from "./errors.js"

describe("toErrorResponse", () => {
  test("maps validation errors to 400", () => {
    expect(toErrorResponse(new ValidationError("잘못된 요청"))).toEqual({
      body: {
        error: {
          code: "validation_error",
          message: "잘못된 요청",
        },
      },
      status: 400,
    })
  })

  test("maps forbidden errors to 403", () => {
    const response = toErrorResponse(new ForbiddenError("금지"))

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe("forbidden")
  })

  test("maps not found errors to 404", () => {
    const response = toErrorResponse(new NotFoundError("없음"))

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe("not_found")
  })

  test("maps conflict errors to 409", () => {
    const response = toErrorResponse(new ConflictError("충돌"))

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe("conflict")
  })

  test("maps syntax errors to invalid_json", () => {
    const response = toErrorResponse(new SyntaxError("bad json"))

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe("invalid_json")
  })

  test("falls back to internal error", () => {
    const response = toErrorResponse(new Error("boom"))

    expect(response.status).toBe(500)
    expect(response.body.error.code).toBe("internal_error")
  })
})
