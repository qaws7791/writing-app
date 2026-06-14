import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdminUsersPage } from "@/features/users/admin-users-page"
import type { AdminApiResult } from "@/lib/api/api-result"
import type { ReadAdminUsersInput } from "@/lib/api/admin-api"
import type {
  AdminDeleteUserResultDto,
  AdminUserDetailDto,
  AdminUserListDto,
} from "@workspace/core/admin"

const filters: ReadAdminUsersInput = {
  page: 1,
  pageSize: 20,
  query: "",
  sort: "lastActive",
  status: "all",
}

const users: AdminUserListDto = {
  items: [
    {
      email: "minji@example.com",
      id: "user-1",
      joined: "2026-06-01",
      lastActive: "2026-06-14",
      lessonsDone: 12,
      name: "민지",
      status: "active",
      streak: 5,
    },
  ],
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 1,
    totalPages: 1,
  },
}

describe("AdminUsersPage", () => {
  it("검색, 상태 필터, 정렬, 사용자 목록과 상태 변경을 렌더링한다", async () => {
    const user = userEvent.setup()
    const updateUserStatus = vi.fn<
      () => Promise<AdminApiResult<AdminUserDetailDto>>
    >(async () => ok(userDetail("suspended")))

    render(
      <AdminUsersPage
        deleteUser={async () => ok({ deleted: true })}
        filters={filters}
        updateUserStatus={updateUserStatus}
        usersResult={ok(users)}
      />
    )

    expect(screen.getByRole("heading", { name: "사용자 관리" })).toBeVisible()
    expect(screen.getByLabelText("사용자 검색")).toHaveValue("")
    expect(screen.getByLabelText("상태")).toHaveDisplayValue("전체")
    expect(screen.getByLabelText("정렬")).toHaveDisplayValue("최근 접속")

    const row = screen.getByRole("row", { name: /민지/ })
    expect(within(row).getByText("minji@example.com")).toBeVisible()
    expect(within(row).getByText("12개 완료")).toBeVisible()
    expect(within(row).getByText("5일")).toBeVisible()

    await user.click(within(row).getByRole("button", { name: "정지" }))

    expect(updateUserStatus).toHaveBeenCalledWith({
      status: "suspended",
      userId: "user-1",
    })
    expect(screen.getByText("사용자 상태를 변경했습니다.")).toBeVisible()
  })

  it("삭제 요청 확인 대화상자를 거쳐 삭제한다", async () => {
    const user = userEvent.setup()
    const deleteUser = vi.fn<
      () => Promise<AdminApiResult<AdminDeleteUserResultDto>>
    >(async () => ok({ deleted: true }))

    render(
      <AdminUsersPage
        deleteUser={deleteUser}
        filters={filters}
        updateUserStatus={async () => ok(userDetail("active"))}
        usersResult={ok(users)}
      />
    )

    await user.click(screen.getByRole("button", { name: "삭제 요청" }))
    expect(
      screen.getByRole("dialog", { name: "삭제 요청 처리 확인" })
    ).toBeVisible()
    await user.click(screen.getByRole("button", { name: "삭제 처리" }))

    expect(deleteUser).toHaveBeenCalledWith("user-1")
    expect(screen.getByText("삭제 요청을 처리했습니다.")).toBeVisible()
  })
})

function ok<TValue>(value: TValue): AdminApiResult<TValue> {
  return {
    status: "ok",
    value,
  }
}

function userDetail(status: "active" | "suspended"): AdminUserDetailDto {
  const firstUser = users.items[0]

  if (firstUser === undefined) {
    throw new Error("사용자 테스트 fixture가 비어 있습니다.")
  }

  return {
    ...firstUser,
    progressPercent: 35,
    status,
    totalLessons: 44,
  }
}
