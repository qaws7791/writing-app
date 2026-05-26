import { describe, expect, it } from "vitest"

import { apiErrorFromResponseBody, networkApiError } from "@/lib/api/api-error"

describe("api-error", () => {
  it("maps backend unauthorized responses", () => {
    expect(
      apiErrorFromResponseBody(401, {
        code: "unauthorized",
        message: "Authentication is required.",
      })
    ).toEqual({
      code: "unauthorized",
      message: "Authentication is required.",
    })
  })

  it("maps unknown server responses to unavailable", () => {
    expect(apiErrorFromResponseBody(503, { message: "down" })).toEqual({
      code: "unavailable",
      message: "API is unavailable.",
    })
  })

  it("maps fetch failures to network errors", () => {
    expect(networkApiError()).toEqual({
      code: "network-error",
      message: "Network request failed.",
    })
  })
})
