import { describe, expect, it } from "vitest"

import { createSeedAdminUserRow } from "@/scripts/seed-admin-user"

describe("seed admin user", () => {
  it("개발용 관리자 계정 row를 결정적으로 만든다", () => {
    const now = new Date("2026-06-14T00:00:00.000Z")

    expect(
      createSeedAdminUserRow({
        email: "admin@example.com",
        name: "관리자",
        now,
      })
    ).toEqual({
      createdAt: now,
      email: "admin@example.com",
      emailVerified: true,
      id: "admin-1",
      image: null,
      name: "관리자",
      role: "owner",
      updatedAt: now,
    })
  })
})
