import { describe, expect, it } from "vitest"

import {
  adminRoles,
  canAccessOwnerAdminRoute,
  parseAdminRole,
} from "@workspace/core/modules/admin/domain/admin-role"

describe("관리자 role 정책", () => {
  it("알려진 관리자 role만 parse한다", () => {
    expect(parseAdminRole(adminRoles.owner)).toBe(adminRoles.owner)
    expect(parseAdminRole(adminRoles.operator)).toBe(adminRoles.operator)
    expect(parseAdminRole("unknown")).toBeNull()
    expect(parseAdminRole(null)).toBeNull()
  })

  it("owner 전용 관리자 route 접근 정책을 판단한다", () => {
    expect(canAccessOwnerAdminRoute(adminRoles.owner)).toBe(true)
    expect(canAccessOwnerAdminRoute(adminRoles.operator)).toBe(false)
  })
})
