import { describe, expect, it } from "vitest"

import { requireAdminSessionRevocationApproval } from "@/scripts/revoke-admin-sessions"

const productionDatabaseUrl = "file:/production/api.sqlite"

describe("관리자 session 폐기 CLI guard", () => {
  it("명시적 대상과 승인, 대상 확인값이 모두 일치해야 실행을 허용한다", () => {
    expect(() =>
      requireAdminSessionRevocationApproval(
        undefined,
        productionDatabaseUrl,
        "true"
      )
    ).toThrow(/명시적인 DATABASE_URL/u)
    expect(() =>
      requireAdminSessionRevocationApproval(
        productionDatabaseUrl,
        productionDatabaseUrl,
        undefined
      )
    ).toThrow(/ADMIN_SESSION_REVOCATION_APPROVED/u)
    expect(() =>
      requireAdminSessionRevocationApproval(
        productionDatabaseUrl,
        "file:/other/api.sqlite",
        "true"
      )
    ).toThrow(/확인값/u)
    expect(
      requireAdminSessionRevocationApproval(
        productionDatabaseUrl,
        productionDatabaseUrl,
        "true"
      )
    ).toBe(productionDatabaseUrl)
  })
})
