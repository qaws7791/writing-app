import type { AdminSettingsDto } from "@workspace/contracts/admin/settings-data"

export type SaveAdminNoticeSettingsInput = {
  readonly announce: string
  readonly banner: string
  readonly now: Date
}

export type SaveAdminLegalSettingsInput = {
  readonly now: Date
  readonly privacy: string
  readonly terms: string
}

export type SettingsRepository = {
  readonly readSettings: () => Promise<AdminSettingsDto>
  readonly saveLegalSettings: (
    input: SaveAdminLegalSettingsInput
  ) => Promise<AdminSettingsDto>
  readonly saveNoticeSettings: (
    input: SaveAdminNoticeSettingsInput
  ) => Promise<AdminSettingsDto>
}
