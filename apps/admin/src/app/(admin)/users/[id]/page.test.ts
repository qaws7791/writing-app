import { describe, expect, it, vi } from "vitest"

const { getAdminUserMock, notFoundMock } = vi.hoisted(() => ({
  getAdminUserMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("not-found")
  }),
}))

vi.mock("next/navigation", () => ({ notFound: notFoundMock }))
vi.mock("@workspace/http-client/admin", () => ({
  getAdminUser: getAdminUserMock,
}))
vi.mock("@/server/http/admin-api-request-options", () => ({
  getServerAdminRequestOptions: vi.fn(async () => ({})),
}))

import AdminUserDetailRoute from "@/app/(admin)/users/[id]/page"

describe("admin user detail route", () => {
  it("잘못된 user ID는 API 호출 전에 notFound로 수렴한다", async () => {
    await expect(
      AdminUserDetailRoute({
        params: Promise.resolve({ id: "" }),
      })
    ).rejects.toThrow("not-found")

    expect(notFoundMock).toHaveBeenCalledTimes(1)
    expect(getAdminUserMock).not.toHaveBeenCalled()
  })
})
