import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdminUsersPage } from "@/features/user-management/ui/admin-users-page"
import type { AdminApiResult } from "@/shared/http/admin-api-result"
import type {
  AdminDeleteUserResult,
  AdminUserDetail,
  AdminUserList,
  ReadAdminUsersInput,
} from "@/entities/learner-account/model/admin-learner-account"
import { userIdSchema } from "@/entities/learner-account/model/learner-account-id"

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

const filters: ReadAdminUsersInput = {
  page: 1,
  pageSize: 20,
  query: "",
  sort: "lastActive",
  status: "all",
}

const users: AdminUserList = {
  items: [
    {
      email: "minji@example.com",
      id: userIdSchema.parse("user-1"),
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
    vi.spyOn(window, "confirm").mockReturnValue(true)
    const updateUserStatus = vi.fn<
      () => Promise<AdminApiResult<AdminUserDetail>>
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
    expect(screen.getByRole("combobox", { name: "상태" })).toBeVisible()
    expect(screen.getByRole("combobox", { name: "정렬" })).toBeVisible()
    expect(screen.getByRole("button", { name: "검색" })).toBeVisible()
    expect(screen.getByLabelText("사용자 검색")).toHaveAttribute(
      "name",
      "query"
    )

    const row = screen.getByRole("row", { name: /민지/ })
    expect(within(row).getByText("minji@example.com")).toBeVisible()
    expect(within(row).getByText("12개 완료")).toBeVisible()
    expect(within(row).getByText("5일")).toBeVisible()

    await user.click(within(row).getByRole("button", { name: "정지" }))

    expect(updateUserStatus).toHaveBeenCalledWith({
      status: "suspended",
      userId: "user-1",
    })
    expect(screen.getByText("사용자를 정지했습니다.")).toBeVisible()

    await user.click(screen.getByRole("combobox", { name: "상태" }))
    await user.click(await screen.findByRole("option", { name: "정지" }))
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("status=suspended")
    )
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining("page=1"))
  }, 15_000)

  it("삭제 요청 확인 대화상자를 거쳐 삭제한다", async () => {
    const user = userEvent.setup()
    const deleteUser = vi.fn<
      () => Promise<AdminApiResult<AdminDeleteUserResult>>
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
      screen.getByRole("alertdialog", { name: "삭제 요청 처리 확인" })
    ).toBeVisible()
    await user.click(screen.getByRole("button", { name: "삭제 처리" }))

    expect(deleteUser).toHaveBeenCalledWith("user-1")
    expect(screen.getByText("삭제 요청을 처리했습니다.")).toBeVisible()
  })

  it("정지 사용자는 활성화하고 삭제 사용자는 읽기 전용으로 표시한다", async () => {
    const user = userEvent.setup()
    vi.spyOn(window, "confirm").mockReturnValue(true)
    const updateUserStatus = vi.fn(async () => ok(userDetail("active")))
    const firstUser = users.items[0]
    if (firstUser === undefined) throw new Error("사용자 fixture가 없습니다.")
    const items: AdminUserList["items"] = [
      { ...firstUser, status: "suspended" },
      {
        ...firstUser,
        email: "deleted@example.com",
        id: userIdSchema.parse("user-deleted"),
        name: "삭제 사용자",
        status: "deleted",
      },
    ]

    render(
      <AdminUsersPage
        deleteUser={async () => ok({ deleted: true })}
        filters={filters}
        updateUserStatus={updateUserStatus}
        usersResult={ok({ ...users, items })}
      />
    )

    await user.click(screen.getByRole("button", { name: "활성화" }))
    expect(updateUserStatus).toHaveBeenCalledWith({
      status: "active",
      userId: "user-1",
    })
    expect(screen.getByText("사용자를 활성화했습니다.")).toBeVisible()
    expect(
      within(screen.getByRole("row", { name: /삭제 사용자/ })).getByText(
        "읽기 전용"
      )
    ).toBeVisible()
  })
})

function ok<TValue>(value: TValue): AdminApiResult<TValue> {
  return {
    status: "ok",
    value,
  }
}

function userDetail(status: "active" | "suspended"): AdminUserDetail {
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
