import { describe, expect, it } from "vitest"

import { authorizeOwnerMutation } from "#core/modules/admin/application/policies/admin-actor-policy"

describe("관리자 owner 변경 인증 보증", () => {
  it.each([
    ["operator", "password", "forbidden"],
    ["owner", "mfa-enrollment-required", "mfa-enrollment-required"],
    ["owner", "mfa-step-up-required", "step-up-required"],
    ["owner", "password", "step-up-required"],
    ["owner", "mfa-step-up-verified", "allowed"],
  ] as const)(
    "%s의 %s 보증을 %s로 판정한다",
    (role, authenticationAssurance, expected) => {
      expect(
        authorizeOwnerMutation({
          authenticationAssurance,
          id: "admin-1",
          role,
        })
      ).toBe(expected)
    }
  )
})
