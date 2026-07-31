// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdminUserDetailPage } from "@/features/user-management/ui/admin-user-detail-page"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import type { AdminUserDetail } from "@/entities/learner-account/model/admin-learner-account"
import { userIdSchema } from "@/entities/learner-account/model/learner-account-id"

const user: AdminUserDetail = {
  email: "minji@example.com",
  id: userIdSchema.parse("user-1"),
  joined: "2026-06-01",
  lastActive: "2026-06-14",
  lessonsDone: 12,
  name: "민지",
  progressPercent: 35,
  status: "active",
  streak: 5,
  totalLessons: 44,
}

describe("AdminUserDetailPage", () => {
  it("상세에서 정지를 확인하면 조회한 사용자로 상태 변경을 요청하고 결과를 알린다", async () => {
    const actor = userEvent.setup()
    const updateUserStatus = vi.fn(async () => ok(user))

    render(
      <AdminUserDetailPage
        deleteUser={async () => ok({ deleted: true })}
        updateUserStatus={updateUserStatus}
        userResult={ok(user)}
      />
    )
    await actor.click(screen.getByRole("button", { name: "정지" }))
    await actor.click(
      within(
        screen.getByRole("alertdialog", { name: "사용자 상태 변경 확인" })
      ).getByRole("button", { name: "정지 처리" })
    )

    expect(updateUserStatus).toHaveBeenCalledWith({
      status: "suspended",
      userId: "user-1",
    })
    expect(screen.getByText("사용자를 정지했습니다.")).toBeVisible()
  })

  it("상세에서 삭제를 확인하면 조회한 사용자로 삭제를 요청한다", async () => {
    const actor = userEvent.setup()
    const deleteUser = vi.fn(async () => ok({ deleted: true }))

    render(
      <AdminUserDetailPage
        deleteUser={deleteUser}
        updateUserStatus={async () => ok(user)}
        userResult={ok(user)}
      />
    )
    await actor.click(screen.getByRole("button", { name: "삭제 요청" }))
    await actor.click(
      within(
        screen.getByRole("alertdialog", { name: "삭제 요청 처리 확인" })
      ).getByRole("button", { name: "삭제 처리" })
    )

    expect(deleteUser).toHaveBeenCalledWith("user-1")
    expect(screen.getByText("삭제 요청을 처리했습니다.")).toBeVisible()
  })
})

function ok<TValue>(value: TValue): AdminRequestResult<TValue> {
  return {
    status: "ok",
    value,
  }
}
