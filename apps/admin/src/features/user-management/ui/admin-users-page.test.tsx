// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdminUsersPage } from "@/features/user-management/ui/admin-users-page"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
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
  it("상태 변경 확인 대화상자는 대상과 전환 결과를 알리고 확인 전에는 변경하지 않는다", async () => {
    const user = userEvent.setup()
    const updateUserStatus = vi.fn<
      () => Promise<AdminRequestResult<AdminUserDetail>>
    >(async () => ok(userDetail("suspended")))

    renderUsersPage({ updateUserStatus })
    await user.click(
      within(readUserRow()).getByRole("button", { name: "정지" })
    )

    expect(
      within(readStatusDialog()).getByText(
        "minji@example.com 사용자를 확인합니다. 사용자를 정지 상태로 전환합니다."
      )
    ).toBeVisible()
    expect(updateUserStatus).not.toHaveBeenCalled()
  })

  it("상태 변경을 취소하면 대화상자를 닫고 상태를 바꾸지 않는다", async () => {
    const user = userEvent.setup()
    const updateUserStatus = vi.fn<
      () => Promise<AdminRequestResult<AdminUserDetail>>
    >(async () => ok(userDetail("suspended")))

    renderUsersPage({ updateUserStatus })
    await user.click(
      within(readUserRow()).getByRole("button", { name: "정지" })
    )
    await user.click(
      within(readStatusDialog()).getByRole("button", { name: "취소" })
    )

    expect(
      screen.queryByRole("alertdialog", { name: "사용자 상태 변경 확인" })
    ).not.toBeInTheDocument()
    expect(updateUserStatus).not.toHaveBeenCalled()
  })

  it("상태 변경을 확인하면 정지로 전환하고 처리 결과를 알린다", async () => {
    const user = userEvent.setup()
    const updateUserStatus = vi.fn<
      () => Promise<AdminRequestResult<AdminUserDetail>>
    >(async () => ok(userDetail("suspended")))

    renderUsersPage({ updateUserStatus })
    await user.click(
      within(readUserRow()).getByRole("button", { name: "정지" })
    )
    await user.click(
      within(readStatusDialog()).getByRole("button", { name: "정지 처리" })
    )

    expect(updateUserStatus).toHaveBeenCalledWith({
      status: "suspended",
      userId: "user-1",
    })
    expect(screen.getByText("사용자를 정지했습니다.")).toBeVisible()
  })

  it("상태 필터를 바꾸면 같은 이동 URL에서 page를 1로 되돌린다", async () => {
    const user = userEvent.setup()

    renderUsersPage({ filters: { ...filters, page: 3 } })
    await user.click(screen.getByRole("combobox", { name: "상태" }))
    await user.click(await screen.findByRole("option", { name: "정지" }))

    const [href] = pushMock.mock.calls.at(-1) ?? []
    expect(href).toContain("status=suspended")
    expect(href).toContain("page=1")
  })

  it("삭제 요청 확인 대화상자를 거쳐 삭제한다", async () => {
    const user = userEvent.setup()
    const deleteUser = vi.fn<
      () => Promise<AdminRequestResult<AdminDeleteUserResult>>
    >(async () => ok({ deleted: true }))

    renderUsersPage({ deleteUser })

    await user.click(screen.getByRole("button", { name: "삭제 요청" }))
    expect(
      screen.getByRole("alertdialog", { name: "삭제 요청 처리 확인" })
    ).toBeVisible()
    await user.click(screen.getByRole("button", { name: "삭제 처리" }))

    expect(deleteUser).toHaveBeenCalledWith("user-1")
    expect(screen.getByText("삭제 요청을 처리했습니다.")).toBeVisible()
  })

  it("상태 변경 처리 중에는 확인을 다시 실행하지 않는다", async () => {
    const user = userEvent.setup()
    let finishUpdate:
      | ((result: AdminRequestResult<AdminUserDetail>) => void)
      | undefined
    const updateUserStatus = vi.fn(
      () =>
        new Promise<AdminRequestResult<AdminUserDetail>>((resolve) => {
          finishUpdate = resolve
        })
    )

    renderUsersPage({ updateUserStatus })

    await user.click(screen.getByRole("button", { name: "정지" }))
    const confirmButton = within(readStatusDialog()).getByRole("button", {
      name: "정지 처리",
    })

    await user.click(confirmButton)

    expect(confirmButton).toBeDisabled()
    await user.click(confirmButton)
    expect(updateUserStatus).toHaveBeenCalledOnce()

    finishUpdate?.(ok(userDetail("suspended")))
    expect(await screen.findByText("사용자를 정지했습니다.")).toBeVisible()
  })

  it("정지 사용자는 활성화하고 삭제 사용자는 읽기 전용으로 표시한다", async () => {
    const user = userEvent.setup()
    const updateUserStatus = vi.fn(async () => ok(userDetail("active")))

    renderUsersPage({
      updateUserStatus,
      usersResult: ok({ ...users, items: suspendedAndDeletedUsers() }),
    })

    await user.click(screen.getByRole("button", { name: "활성화" }))
    await user.click(
      within(readStatusDialog()).getByRole("button", { name: "활성화 처리" })
    )
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

function renderUsersPage({
  deleteUser = async () => ok({ deleted: true }),
  filters: pageFilters = filters,
  updateUserStatus = async () => ok(userDetail("active")),
  usersResult = ok(users),
}: {
  readonly deleteUser?: () => Promise<AdminRequestResult<AdminDeleteUserResult>>
  readonly filters?: ReadAdminUsersInput
  readonly updateUserStatus?: () => Promise<AdminRequestResult<AdminUserDetail>>
  readonly usersResult?: AdminRequestResult<AdminUserList>
} = {}) {
  return render(
    <AdminUsersPage
      deleteUser={deleteUser}
      filters={pageFilters}
      updateUserStatus={updateUserStatus}
      usersResult={usersResult}
    />
  )
}

function readUserRow(): HTMLElement {
  return screen.getByRole("row", { name: /민지/ })
}

function readStatusDialog(): HTMLElement {
  return screen.getByRole("alertdialog", { name: "사용자 상태 변경 확인" })
}

function suspendedAndDeletedUsers(): AdminUserList["items"] {
  const firstUser = users.items[0]

  if (firstUser === undefined) {
    throw new Error("사용자 테스트 fixture가 비어 있습니다.")
  }

  return [
    { ...firstUser, status: "suspended" },
    {
      ...firstUser,
      email: "deleted@example.com",
      id: userIdSchema.parse("user-deleted"),
      name: "삭제 사용자",
      status: "deleted",
    },
  ]
}

function ok<TValue>(value: TValue): AdminRequestResult<TValue> {
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
