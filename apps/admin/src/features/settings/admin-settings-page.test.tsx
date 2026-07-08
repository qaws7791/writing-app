import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdminSettingsPage } from "@/features/settings/admin-settings-page"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminContentResetResult,
  AdminSettings,
} from "@/lib/api/admin-api"

const settings: AdminSettings = {
  legal: {
    privacy: "개인정보처리방침",
    terms: "이용약관",
  },
  notice: {
    announce: "공지 본문",
    banner: "오늘의 공지",
  },
}

describe("AdminSettingsPage", () => {
  it("공지, 약관, 개인정보 설정을 저장한다", async () => {
    const user = userEvent.setup()
    const saveNoticeSettings = vi.fn<
      () => Promise<AdminApiResult<AdminSettings>>
    >(async () => ok(settings))
    const saveLegalSettings = vi.fn<
      () => Promise<AdminApiResult<AdminSettings>>
    >(async () => ok(settings))

    render(
      <AdminSettingsPage
        resetContent={async () => ok(resetResult)}
        saveLegalSettings={saveLegalSettings}
        saveNoticeSettings={saveNoticeSettings}
        settingsResult={ok(settings)}
      />
    )

    expect(screen.getByLabelText("상단 배너 문구")).toHaveValue("오늘의 공지")

    await user.click(screen.getByRole("button", { name: "약관·개인정보" }))
    expect(screen.getByLabelText("이용약관")).toHaveValue("이용약관")
    expect(screen.getByLabelText("개인정보처리방침")).toHaveValue(
      "개인정보처리방침"
    )

    await user.click(screen.getByRole("button", { name: "공지·배너" }))
    await user.click(screen.getByRole("button", { name: "저장" }))
    await user.click(screen.getByRole("button", { name: "약관·개인정보" }))
    await user.click(screen.getByRole("button", { name: "저장" }))

    expect(saveNoticeSettings).toHaveBeenCalledWith({
      announce: "공지 본문",
      banner: "오늘의 공지",
    })
    expect(saveLegalSettings).toHaveBeenCalledWith({
      privacy: "개인정보처리방침",
      terms: "이용약관",
    })
    expect(screen.getByText("운영 설정을 저장했습니다.")).toBeVisible()
  })

  it("콘텐츠 초기화 확인 대화상자를 거쳐 초기화한다", async () => {
    const user = userEvent.setup()
    const resetContent = vi.fn<
      () => Promise<AdminApiResult<AdminContentResetResult>>
    >(async () => ok(resetResult))

    render(
      <AdminSettingsPage
        resetContent={resetContent}
        saveLegalSettings={async () => ok(settings)}
        saveNoticeSettings={async () => ok(settings)}
        settingsResult={ok(settings)}
      />
    )

    await user.click(screen.getByRole("button", { name: "접근·콘텐츠" }))
    await user.click(screen.getByRole("button", { name: "콘텐츠 초기화" }))
    expect(
      screen.getByRole("alertdialog", { name: "콘텐츠 초기화 확인" })
    ).toBeVisible()
    await user.click(screen.getByRole("button", { name: "초기화 실행" }))

    expect(resetContent).toHaveBeenCalled()
    expect(screen.getByText("콘텐츠를 초기화했습니다.")).toBeVisible()
    expect(screen.getByText("revision 4")).toBeVisible()
  })
})

const resetResult: AdminContentResetResult = {
  changed: {
    archived: 0,
    courses: 5,
    lessons: 44,
    steps: 136,
    units: 15,
  },
  revision: 4,
}

function ok<TValue>(value: TValue): AdminApiResult<TValue> {
  return {
    status: "ok",
    value,
  }
}
