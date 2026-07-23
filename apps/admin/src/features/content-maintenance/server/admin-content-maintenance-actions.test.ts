import { beforeEach, describe, expect, it, vi } from "vitest"

const { getSessionTokenMock, resetContentMock } = vi.hoisted(() => ({
  getSessionTokenMock: vi.fn(),
  resetContentMock: vi.fn(),
}))

vi.mock(
  "@/features/content-maintenance/server/admin-content-maintenance-dal",
  () => ({
    createAdminContentMaintenanceDal: () => ({
      resetContent: resetContentMock,
    }),
  })
)
vi.mock("@/server/http/get-admin-http-transport", () => ({
  getServerAdminHttpTransport: vi.fn(),
}))
vi.mock("@/server/auth/get-admin-session-token", () => ({
  getServerAdminSessionToken: getSessionTokenMock,
}))

import { resetAdminContentAction } from "@/features/content-maintenance/server/admin-content-maintenance-actions"

describe("admin content maintenance actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSessionTokenMock.mockResolvedValue("session-token")
  })

  it("인증된 요청을 콘텐츠 초기화 DAL에 전달한다", async () => {
    resetContentMock.mockResolvedValue({ status: "ok", value: {} })

    await resetAdminContentAction()

    expect(resetContentMock).toHaveBeenCalledOnce()
  })

  it("미인증 요청은 DAL을 호출하지 않는다", async () => {
    getSessionTokenMock.mockResolvedValue(null)

    await resetAdminContentAction()

    expect(resetContentMock).not.toHaveBeenCalled()
  })
})
