import { beforeEach, describe, expect, it, vi } from "vitest"
import { userIdSchema } from "@/entities/learner-account/model/learner-account-id"
import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const {
  deleteAdminUserMock,
  getServerAdminRequestOptionsMock,
  revalidatePathMock,
  updateAdminUserStatusMock,
} = vi.hoisted(() => ({
  deleteAdminUserMock: vi.fn(),
  getServerAdminRequestOptionsMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  updateAdminUserStatusMock: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }))
vi.mock("@workspace/http-client/admin", () => ({
  deleteAdminUser: deleteAdminUserMock,
  updateAdminUserStatus: updateAdminUserStatusMock,
}))
vi.mock("@/server/http/admin-api-request-options", () => ({
  getServerAdminRequestOptions: getServerAdminRequestOptionsMock,
}))

import {
  deleteAdminUserAction,
  updateAdminUserStatusAction,
} from "@/features/user-management/server/admin-user-actions"

describe("admin user actions", () => {
  const userId = userIdSchema.parse("user-1")
  beforeEach(() => {
    getServerAdminRequestOptionsMock.mockResolvedValue({})
  })

  it("상태 변경 성공 시 목록과 상세를 재검증한다", async () => {
    updateAdminUserStatusMock.mockResolvedValue({})

    await updateAdminUserStatusAction({ status: "active", userId })

    expect(updateAdminUserStatusMock).toHaveBeenCalledWith(
      "user-1",
      { status: "active" },
      {}
    )
    expect(revalidatePathMock).toHaveBeenCalledWith("/users")
    expect(revalidatePathMock).toHaveBeenCalledWith("/users/user-1")
  })

  it("삭제 성공 시 목록과 상세를 재검증한다", async () => {
    deleteAdminUserMock.mockResolvedValue({ deleted: true })

    await deleteAdminUserAction(userId)

    expect(deleteAdminUserMock).toHaveBeenCalledWith("user-1", {})
    expect(revalidatePathMock).toHaveBeenCalledWith("/users")
    expect(revalidatePathMock).toHaveBeenCalledWith("/users/user-1")
  })

  it("API 실패에서는 경로를 재검증하지 않는다", async () => {
    deleteAdminUserMock.mockRejectedValue(
      new GeneratedApiClientError({
        kind: "network",
        method: "DELETE",
        url: "https://api.example.test/api/admin/users/user-1",
      })
    )

    await deleteAdminUserAction(userId)

    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("잘못된 상태 입력은 상태 변경 API를 호출하지 않는다", async () => {
    await updateAdminUserStatusAction({ status: "deleted", userId })

    expect(updateAdminUserStatusMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("미인증 삭제 요청은 API를 호출하지 않는다", async () => {
    getServerAdminRequestOptionsMock.mockResolvedValue(null)

    await deleteAdminUserAction(userId)

    expect(deleteAdminUserMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })
})
