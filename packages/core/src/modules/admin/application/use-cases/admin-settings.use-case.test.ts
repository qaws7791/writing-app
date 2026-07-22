import { describe, expect, it, vi } from "vitest"

import { adminIdSchema } from "@workspace/contracts/identity/data"
import type { AdminSettingsDto } from "@workspace/contracts/operations/settings-data"
import type { SettingsRepository } from "#core/modules/admin/application/ports/admin-settings.repository"
import { createAdminSettingsUseCase } from "#core/modules/admin/application/use-cases/admin-settings.use-case"

const ownerActor = {
  id: adminIdSchema.parse("owner-1"),
  role: "owner",
} as const

const operatorActor = {
  id: adminIdSchema.parse("operator-1"),
  role: "operator",
} as const

const settings: AdminSettingsDto = {
  legal: {
    privacy: "개인정보처리방침",
    terms: "이용약관",
  },
  notice: {
    announce: "공지 내용",
    banner: "상단 배너",
  },
}

describe("관리자 settings use case", () => {
  it("좁은 settings repository에서 현재 설정을 조회한다", async () => {
    const repository = createSettingsRepository()
    const useCase = createAdminSettingsUseCase(repository)

    await expect(useCase.getSettings()).resolves.toEqual(settings)
    expect(repository.readSettings).toHaveBeenCalledOnce()
  })

  it("owner의 공지와 법적 문서 저장 입력에서 actor를 제거하고 repository 결과를 반환한다", async () => {
    const repository = createSettingsRepository()
    const useCase = createAdminSettingsUseCase(repository)
    const now = new Date("2026-06-14T03:00:00.000Z")

    await expect(
      useCase.updateNoticeSettings({
        actor: ownerActor,
        announce: settings.notice.announce,
        banner: settings.notice.banner,
        now,
      })
    ).resolves.toEqual({ kind: "ok", value: settings })
    await expect(
      useCase.updateLegalSettings({
        actor: ownerActor,
        now,
        privacy: settings.legal.privacy,
        terms: settings.legal.terms,
      })
    ).resolves.toEqual({ kind: "ok", value: settings })

    expect(repository.saveNoticeSettings).toHaveBeenCalledWith({
      announce: settings.notice.announce,
      banner: settings.notice.banner,
      now,
    })
    expect(repository.saveLegalSettings).toHaveBeenCalledWith({
      now,
      privacy: settings.legal.privacy,
      terms: settings.legal.terms,
    })
  })

  it("operator의 저장 요청은 repository 호출 전에 forbidden으로 거절한다", async () => {
    const repository = createSettingsRepository()
    const useCase = createAdminSettingsUseCase(repository)
    const now = new Date("2026-06-14T03:00:00.000Z")

    await expect(
      useCase.updateNoticeSettings({
        actor: operatorActor,
        announce: "거절할 공지",
        banner: "거절할 배너",
        now,
      })
    ).resolves.toEqual({ kind: "forbidden" })
    await expect(
      useCase.updateLegalSettings({
        actor: operatorActor,
        now,
        privacy: "거절할 개인정보처리방침",
        terms: "거절할 이용약관",
      })
    ).resolves.toEqual({ kind: "forbidden" })

    expect(repository.saveNoticeSettings).not.toHaveBeenCalled()
    expect(repository.saveLegalSettings).not.toHaveBeenCalled()
  })
})

function createSettingsRepository(): SettingsRepository & {
  readonly readSettings: ReturnType<
    typeof vi.fn<SettingsRepository["readSettings"]>
  >
  readonly saveLegalSettings: ReturnType<
    typeof vi.fn<SettingsRepository["saveLegalSettings"]>
  >
  readonly saveNoticeSettings: ReturnType<
    typeof vi.fn<SettingsRepository["saveNoticeSettings"]>
  >
} {
  return {
    readSettings: vi.fn(async () => settings),
    saveLegalSettings: vi.fn(async () => settings),
    saveNoticeSettings: vi.fn(async () => settings),
  }
}
