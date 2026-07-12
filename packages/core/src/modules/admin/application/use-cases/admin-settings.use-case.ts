import {
  adminSettingsDtoSchema,
  type AdminSettingsDto,
} from "@workspace/core/modules/admin/domain/admin.dto"
import type {
  SaveAdminLegalSettingsInput,
  SaveAdminNoticeSettingsInput,
  SettingsRepository,
} from "@workspace/core/modules/admin/application/ports/admin.repository"
import {
  authorizeOwnerMutation,
  type AdminOwnerMutationResult,
  type OwnerAdminCommand,
} from "@workspace/core/modules/admin/application/policies/admin-actor-policy"

export type AdminSettingsUseCase = {
  readonly getSettings: () => Promise<AdminSettingsDto>
  readonly updateLegalSettings: (
    input: OwnerAdminCommand<SaveAdminLegalSettingsInput>
  ) => Promise<AdminOwnerMutationResult<AdminSettingsDto>>
  readonly updateNoticeSettings: (
    input: OwnerAdminCommand<SaveAdminNoticeSettingsInput>
  ) => Promise<AdminOwnerMutationResult<AdminSettingsDto>>
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
    async updateLegalSettings({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      const value = adminSettingsDtoSchema.parse(
        await settingsRepository.saveLegalSettings(input)
      )
      return { kind: "ok", value }
    },
    async updateNoticeSettings({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      const value = adminSettingsDtoSchema.parse(
        await settingsRepository.saveNoticeSettings(input)
      )
      return { kind: "ok", value }
    },
  }
}
