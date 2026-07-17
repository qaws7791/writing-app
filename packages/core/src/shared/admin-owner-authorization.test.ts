import { describe, expect, it } from "vitest"

import {
  adminIdSchema,
  adminRoles,
} from "@workspace/contracts/admin/identity-data"
import { authorizeOwnerMutation } from "#core/shared/admin-owner-authorization"

describe("관리자 owner 변경 권한", () => {
  it.each([
    [adminRoles.operator, "forbidden"],
    [adminRoles.owner, "allowed"],
  ] as const)("%s을 %s로 판정한다", (role, expected) => {
    expect(
      authorizeOwnerMutation({
        id: adminIdSchema.parse("admin-1"),
        role,
      })
    ).toBe(expected)
  })
})
