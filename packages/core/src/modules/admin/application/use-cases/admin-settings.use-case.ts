import type { AdminSettingsDto } from "@workspace/contracts/operations/settings-data"
import type {
  SaveAdminLegalSettingsInput,
  SaveAdminNoticeSettingsInput,
  SettingsRepository,
} from "#core/modules/admin/application/ports/admin-settings.repository"
import {
  authorizeOwnerMutation,
  type OwnerAdminCommand,
} from "#core/shared/admin-owner-authorization"

export type AdminSettingsUpdateResult =
  | { readonly kind: "forbidden" }
  | { readonly kind: "ok"; readonly value: AdminSettingsDto }

export type AdminSettingsUseCase = {
  readonly getSettings: () => Promise<AdminSettingsDto>
  readonly updateLegalSettings: (
    input: OwnerAdminCommand<SaveAdminLegalSettingsInput>
  ) => Promise<AdminSettingsUpdateResult>
  readonly updateNoticeSettings: (
    input: OwnerAdminCommand<SaveAdminNoticeSettingsInput>
  ) => Promise<AdminSettingsUpdateResult>
}

export function createAdminSettingsUseCase(
  settingsRepository: SettingsRepository
): AdminSettingsUseCase {
  return {
    async getSettings() {
      return settingsRepository.readSettings()
    },
    async updateLegalSettings({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      const value = await settingsRepository.saveLegalSettings(input)
      return { kind: "ok", value }
    },
    async updateNoticeSettings({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      const value = await settingsRepository.saveNoticeSettings(input)
      return { kind: "ok", value }
    },
  }
}
