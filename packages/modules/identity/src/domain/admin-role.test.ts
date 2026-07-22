import { describe, expect, it } from "vitest"
import type { AdminId } from "@workspace/types/ids"

import {
  adminRoles,
  authorizeOwnerMutation,
  decideAdminRoleChange,
  parseAdminRole,
} from "#identity/domain/admin-role"

const ownerId = "owner-1" as AdminId
const operatorId = "operator-1" as AdminId

describe("identity 관리자 role과 owner 정책", () => {
  it("알려진 role만 parse하고 owner만 변경 작업을 허용한다", () => {
    expect(parseAdminRole("owner")).toBe(adminRoles.owner)
    expect(parseAdminRole("operator")).toBe(adminRoles.operator)
    expect(parseAdminRole("unknown")).toBeNull()
    expect(
      authorizeOwnerMutation({ id: ownerId, role: adminRoles.owner })
    ).toBe("allowed")
    expect(
      authorizeOwnerMutation({ id: operatorId, role: adminRoles.operator })
    ).toBe("forbidden")
  })

  it("owner는 다른 관리자의 role을 변경할 수 있다", () => {
    expect(
      decideAdminRoleChange({
        actor: { id: ownerId, role: adminRoles.owner },
        identity: { id: operatorId, role: adminRoles.operator },
        role: adminRoles.owner,
      })._unsafeUnwrap()
    ).toEqual({ id: operatorId, role: adminRoles.owner })
  })

  it("operator 변경과 마지막 owner의 자기 강등을 거절한다", () => {
    expect(
      decideAdminRoleChange({
        actor: { id: operatorId, role: adminRoles.operator },
        identity: { id: ownerId, role: adminRoles.owner },
        role: adminRoles.operator,
      })._unsafeUnwrapErr()
    ).toEqual({ kind: "identity-forbidden" })
    expect(
      decideAdminRoleChange({
        actor: { id: ownerId, role: adminRoles.owner },
        identity: { id: ownerId, role: adminRoles.owner },
        role: adminRoles.operator,
      })._unsafeUnwrapErr()
    ).toEqual({ kind: "identity-forbidden" })
  })
})
