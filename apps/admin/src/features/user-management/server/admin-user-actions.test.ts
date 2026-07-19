import { beforeEach, describe, expect, it, vi } from "vitest"
import { userIdSchema } from "@/entities/learner-account/model/learner-account-id"

const {
  deleteUserMock,
  getSessionTokenMock,
  revalidatePathMock,
  updateUserStatusMock,
} = vi.hoisted(() => ({
  deleteUserMock: vi.fn(),
  getSessionTokenMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  updateUserStatusMock: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }))
vi.mock("@/features/user-management/server/admin-users-dal", () => ({
  createAdminUsersDal: () => ({
    deleteUser: deleteUserMock,
    updateUserStatus: updateUserStatusMock,
  }),
}))
vi.mock("@/server/http/get-admin-http-transport", () => ({
  getServerAdminHttpTransport: vi.fn(),
}))
vi.mock("@/server/auth/get-admin-session-token", () => ({
  getServerAdminSessionToken: getSessionTokenMock,
}))

import {
  deleteAdminUserAction,
  updateAdminUserStatusAction,
} from "@/features/user-management/server/admin-user-actions"

describe("admin user actions", () => {
  const userId = userIdSchema.parse("user-1")
  beforeEach(() => {
    vi.clearAllMocks()
    getSessionTokenMock.mockResolvedValue("session-token")
  })

  it("상태 변경과 삭제 성공 시 목록과 상세를 재검증한다", async () => {
    updateUserStatusMock.mockResolvedValue({ status: "ok", value: {} })
    deleteUserMock.mockResolvedValue({
      status: "ok",
      value: { deleted: true },
    })

    await updateAdminUserStatusAction({ status: "active", userId })
    await deleteAdminUserAction(userId)

    expect(revalidatePathMock.mock.calls).toEqual([
      ["/users"],
      ["/users/user-1"],
      ["/users"],
      ["/users/user-1"],
    ])
  })

  it("API 실패에서는 경로를 재검증하지 않는다", async () => {
    deleteUserMock.mockResolvedValue({
      error: { code: "NETWORK_ERROR", message: "실패" },
      status: "error",
    })

    await deleteAdminUserAction(userId)

    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("잘못된 입력과 미인증 요청은 API를 호출하지 않는다", async () => {
    await updateAdminUserStatusAction({ status: "deleted", userId })
    getSessionTokenMock.mockResolvedValue(null)
    await deleteAdminUserAction(userId)

    expect(updateUserStatusMock).not.toHaveBeenCalled()
    expect(deleteUserMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })
})
