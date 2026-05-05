import { describe, expect, test } from "vitest"

import { parseUserId, toUserId } from "./brand"

describe("brand", () => {
  test("parses valid branded ids", () => {
    expect(parseUserId("user-1")).toBe("user-1")
  })

  test("rejects invalid id inputs", () => {
    expect(() => parseUserId("")).toThrow()
  })

  test("keeps trusted constructors available for internal fixtures", () => {
    expect(toUserId("trusted-user")).toBe("trusted-user")
  })
})
