import { describe, expect, test } from "bun:test"

import { isApiTransportFile } from "./check-architecture-boundaries"

describe("API transport persistence boundary", () => {
  test("target 관리자 transport helper를 persistence import 금지 범위에 포함한다", () => {
    expect(isApiTransportFile("api/src/admin/admin-auth.middleware.ts")).toBe(
      true
    )
    expect(isApiTransportFile("api/src/admin/admin-openapi.ts")).toBe(true)
  })

  test("composition, adapter와 legacy auth implementation은 transport로 분류하지 않는다", () => {
    expect(
      isApiTransportFile(
        "api/src/composition/admin-route-composition-context.ts"
      )
    ).toBe(false)
    expect(
      isApiTransportFile(
        "api/src/adapters/auth/admin-session-drizzle.repository.ts"
      )
    ).toBe(false)
    expect(isApiTransportFile("admin-api/src/auth/admin-auth.ts")).toBe(false)
  })
})
