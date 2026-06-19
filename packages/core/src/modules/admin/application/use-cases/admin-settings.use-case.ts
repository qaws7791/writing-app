import {
  adminSettingsDtoSchema,
  type AdminSettingsDto,
} from "@workspace/core/modules/admin/domain/admin.dto"
import type {
  SaveAdminLegalSettingsInput,
  SaveAdminNoticeSettingsInput,
  SettingsRepository,
} from "@workspace/core/modules/admin/application/ports/admin.repository"

export type AdminSettingsUseCase = {
  readonly getSettings: () => Promise<AdminSettingsDto>
  readonly updateLegalSettings: (
    input: SaveAdminLegalSettingsInput
  ) => Promise<AdminSettingsDto>
  readonly updateNoticeSettings: (
    input: SaveAdminNoticeSettingsInput
  ) => Promise<AdminSettingsDto>
}

export function createAdminSettingsUseCase(
  settingsRepository: SettingsRepository
): AdminSettingsUseCase {
  return {
    async getSettings() {
      return adminSettingsDtoSchema.parse(
        await settingsRepository.readSettings()
      )
    },
    async updateLegalSettings(input) {
      return adminSettingsDtoSchema.parse(
        await settingsRepository.saveLegalSettings(input)
      )
    },
    async updateNoticeSettings(input) {
      return adminSettingsDtoSchema.parse(
        await settingsRepository.saveNoticeSettings(input)
      )
    },
  }
}
