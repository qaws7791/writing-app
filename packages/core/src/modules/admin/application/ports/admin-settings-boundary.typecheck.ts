import type {
  SaveAdminLegalSettingsInput,
  SaveAdminNoticeSettingsInput,
  SettingsRepository,
} from "#core/modules/admin/application/ports/admin-settings.repository"
import type { AdminSettingsUpdateResult } from "#core/modules/admin/application/use-cases/admin-settings.use-case"

type Assert<TValue extends true> = TValue
type Equal<TLeft, TRight> = [TLeft] extends [TRight]
  ? [TRight] extends [TLeft]
    ? true
    : false
  : false

export type AdminSettingsBoundary = [
  Assert<
    Equal<
      keyof SettingsRepository,
      "readSettings" | "saveLegalSettings" | "saveNoticeSettings"
    >
  >,
  Assert<
    Equal<keyof SaveAdminNoticeSettingsInput, "announce" | "banner" | "now">
  >,
  Assert<Equal<keyof SaveAdminLegalSettingsInput, "now" | "privacy" | "terms">>,
  Assert<Equal<AdminSettingsUpdateResult["kind"], "forbidden" | "ok">>,
]
