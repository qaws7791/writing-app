import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  getSessionTokenMock,
  resetContentMock,
  saveLegalSettingsMock,
  saveNoticeSettingsMock,
} = vi.hoisted(() => ({
  getSessionTokenMock: vi.fn(),
  resetContentMock: vi.fn(),
  saveLegalSettingsMock: vi.fn(),
  saveNoticeSettingsMock: vi.fn(),
}))

vi.mock("@/features/settings-management/server/admin-settings-dal", () => ({
  createAdminSettingsDal: () => ({
    resetContent: resetContentMock,
    saveLegalSettings: saveLegalSettingsMock,
    saveNoticeSettings: saveNoticeSettingsMock,
  }),
}))
vi.mock("@/server/http/get-admin-http-transport", () => ({
  getServerAdminHttpTransport: vi.fn(),
}))
vi.mock("@/server/auth/get-admin-session-token", () => ({
  getServerAdminSessionToken: getSessionTokenMock,
}))

import {
  resetAdminContentAction,
  saveAdminLegalSettingsAction,
  saveAdminNoticeSettingsAction,
} from "@/features/settings-management/server/admin-settings-actions"

describe("admin settings actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSessionTokenMock.mockResolvedValue("session-token")
  })

  it("검증된 설정 command만 DAL에 전달한다", async () => {
    saveNoticeSettingsMock.mockResolvedValue({ status: "ok", value: {} })
    saveLegalSettingsMock.mockResolvedValue({ status: "ok", value: {} })
    resetContentMock.mockResolvedValue({ status: "ok", value: {} })

    await saveAdminNoticeSettingsAction({ announce: "공지", banner: "배너" })
    await saveAdminLegalSettingsAction({ privacy: "개인정보", terms: "약관" })
    await resetAdminContentAction()

    expect(saveNoticeSettingsMock).toHaveBeenCalledWith({
      announce: "공지",
      banner: "배너",
    })
    expect(saveLegalSettingsMock).toHaveBeenCalledWith({
      privacy: "개인정보",
      terms: "약관",
    })
    expect(resetContentMock).toHaveBeenCalledTimes(1)
  })

  it("잘못된 입력과 미인증 요청은 DAL을 호출하지 않는다", async () => {
    await saveAdminNoticeSettingsAction({ announce: 1 })
    getSessionTokenMock.mockResolvedValue(null)
    await saveAdminLegalSettingsAction({ privacy: "개인정보", terms: "약관" })
    await resetAdminContentAction()

    expect(saveNoticeSettingsMock).not.toHaveBeenCalled()
    expect(saveLegalSettingsMock).not.toHaveBeenCalled()
    expect(resetContentMock).not.toHaveBeenCalled()
  })
})
