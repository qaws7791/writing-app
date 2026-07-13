import { describe, expect, it } from "vitest"

import { authorizeOwnerMutation } from "#core/modules/admin/application/policies/admin-actor-policy"
import { adminIdSchema } from "@workspace/contracts/admin"

describe("관리자 owner 변경 권한", () => {
  it.each([
    ["operator", "forbidden"],
    ["owner", "allowed"],
  ] as const)("%s을 %s로 판정한다", (role, expected) => {
    expect(
      authorizeOwnerMutation({
        id: adminIdSchema.parse("admin-1"),
        role,
      })
    ).toBe(expected)
  })
})
