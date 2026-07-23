import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { AdminContentResetResultDto } from "@workspace/contracts/content/admin-content-reset"

import { AdminContentMaintenancePage } from "@/features/content-maintenance/ui/admin-content-maintenance-page"
import type { AdminApiResult } from "@/shared/http/admin-api-result"

describe("AdminContentMaintenancePage", () => {
  it("확인 대화상자를 거쳐 콘텐츠를 초기화한다", async () => {
    const user = userEvent.setup()
    const resetContent = vi.fn<
      () => Promise<AdminApiResult<AdminContentResetResultDto>>
    >(async () => ({ status: "ok", value: resetResult }))

    render(<AdminContentMaintenancePage resetContent={resetContent} />)

    await user.click(screen.getByRole("button", { name: "콘텐츠 초기화" }))
    expect(
      screen.getByRole("alertdialog", { name: "콘텐츠 초기화 확인" })
    ).toBeVisible()
    await user.click(screen.getByRole("button", { name: "초기화 실행" }))

    expect(resetContent).toHaveBeenCalledOnce()
    expect(screen.getByText("콘텐츠를 초기화했습니다.")).toBeVisible()
    expect(screen.getByText("revision 4")).toBeVisible()
  })
})

const resetResult: AdminContentResetResultDto = {
  changed: {
    archived: 0,
    courses: 5,
    lessons: 44,
    steps: 136,
    units: 15,
  },
  revision: 4,
}
