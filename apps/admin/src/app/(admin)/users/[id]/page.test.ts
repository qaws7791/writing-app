import { beforeEach, describe, expect, it, vi } from "vitest"

const { getAdminUserMock, getServerAdminRequestOptionsMock, notFoundMock } =
  vi.hoisted(() => ({
    getAdminUserMock: vi.fn(),
    getServerAdminRequestOptionsMock: vi.fn(),
    notFoundMock: vi.fn(() => {
      throw new Error("not-found")
    }),
  }))

vi.mock("next/navigation", () => ({ notFound: notFoundMock }))
vi.mock("@workspace/http-client/admin", () => ({
  getAdminUser: getAdminUserMock,
}))
vi.mock("@/server/http/admin-api-request-options", () => ({
  getServerAdminRequestOptions: getServerAdminRequestOptionsMock,
}))

import AdminUserDetailRoute from "@/app/(admin)/users/[id]/page"

describe("admin user detail route", () => {
  beforeEach(() => {
    getServerAdminRequestOptionsMock.mockResolvedValue({ cache: "no-store" })
    getAdminUserMock.mockResolvedValue({ id: "user-1", name: "민지" })
  })

  it("잘못된 user ID는 API 호출 전에 notFound로 수렴한다", async () => {
    await expect(
      AdminUserDetailRoute({
        params: Promise.resolve({ id: "" }),
      })
    ).rejects.toThrow("not-found")

    expect(getAdminUserMock).not.toHaveBeenCalled()
  })

  it("세션이 없으면 사용자 상세를 조회하지 않는다", async () => {
    getServerAdminRequestOptionsMock.mockResolvedValue(null)

    await AdminUserDetailRoute({ params: Promise.resolve({ id: "user-1" }) })

    expect(getAdminUserMock).not.toHaveBeenCalled()
  })
})
