import {
  resetAdminContentAction,
  saveAdminLegalSettingsAction,
  saveAdminNoticeSettingsAction,
} from "@/features/settings-management/server/admin-settings-actions"
import { createAdminSettingsDal } from "@/features/settings-management/server/admin-settings-dal"
import { AdminSettingsPage } from "@/features/settings-management/ui/admin-settings-page"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"

export default async function AdminSettingsRoute() {
  const settingsResult = await createAdminSettingsDal(
    getServerAdminHttpTransport({
      tokenProvider: getServerAdminSessionToken,
    })
  ).getSettings()

  return (
    <AdminSettingsPage
      resetContent={resetAdminContentAction}
      saveLegalSettings={saveAdminLegalSettingsAction}
      saveNoticeSettings={saveAdminNoticeSettingsAction}
      settingsResult={settingsResult}
    />
  )
}
