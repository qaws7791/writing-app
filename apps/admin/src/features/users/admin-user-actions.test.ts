import { beforeEach, describe, expect, it, vi } from "vitest"
import { userIdSchema } from "@/lib/api/admin-identity"

const { deleteUserMock, revalidatePathMock, updateUserStatusMock } = vi.hoisted(
  () => ({
    deleteUserMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    updateUserStatusMock: vi.fn(),
  })
)

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }))
vi.mock("@/features/users/admin-users-api", () => ({
  createAdminUsersApi: () => ({
    deleteUser: deleteUserMock,
    updateUserStatus: updateUserStatusMock,
  }),
}))
vi.mock("@/lib/api/get-server-admin-http-transport", () => ({
  getServerAdminHttpTransport: vi.fn(),
}))
vi.mock("@/lib/auth/server-admin-session-token", () => ({
  getServerAdminSessionToken: vi.fn(),
}))

import {
  deleteAdminUserAction,
  updateAdminUserStatusAction,
} from "@/features/users/admin-user-actions"

describe("admin user actions", () => {
  const userId = userIdSchema.parse("user-1")
  beforeEach(() => {
    vi.clearAllMocks()
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
})
