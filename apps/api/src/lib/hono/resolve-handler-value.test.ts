import { err, ok } from "neverthrow"
import { describe, expect, test } from "vitest"

import { RouteStatusResponse } from "./route-status-response"
import { resolveHandlerValue } from "./resolve-handler-value"

describe("resolveHandlerValue", () => {
  test("unwraps Result and RouteStatusResponse recursively", () => {
    const value = ok(new RouteStatusResponse({ accepted: true }, 202))

    expect(resolveHandlerValue(value)).toEqual({
      data: { accepted: true },
      status: 202,
    })
  })

  test("returns plain data without forcing a status", () => {
    expect(resolveHandlerValue({ ok: true })).toEqual({
      data: { ok: true },
    })
  })

  test("rethrows error results", () => {
    const error = new Error("boom")

    expect(() => resolveHandlerValue(err(error))).toThrow(error)
  })
})
