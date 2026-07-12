import { AdminSettingsPage } from "@/features/settings/admin-settings-page"
import { createAdminSettingsApi } from "@/features/settings/admin-settings-api"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminSettingsRoute() {
  const api = createAdminSettingsApi(
    getServerAdminHttpTransport({
      tokenProvider: getServerAdminSessionToken,
    })
  )
  const settingsResult = await api.getSettings()

  async function saveNoticeSettings(input: {
    readonly announce: string
    readonly banner: string
  }) {
    "use server"

    const serverApi = createAdminSettingsApi(
      getServerAdminHttpTransport({
        tokenProvider: getServerAdminSessionToken,
      })
    )

    return serverApi.saveNoticeSettings(input)
  }

  async function saveLegalSettings(input: {
    readonly privacy: string
    readonly terms: string
  }) {
    "use server"

    const serverApi = createAdminSettingsApi(
      getServerAdminHttpTransport({
        tokenProvider: getServerAdminSessionToken,
      })
    )

    return serverApi.saveLegalSettings(input)
  }

  async function resetContent() {
    "use server"

    const serverApi = createAdminSettingsApi(
      getServerAdminHttpTransport({
        tokenProvider: getServerAdminSessionToken,
      })
    )

    return serverApi.resetContent()
  }

  return (
    <AdminSettingsPage
      resetContent={resetContent}
      saveLegalSettings={saveLegalSettings}
      saveNoticeSettings={saveNoticeSettings}
      settingsResult={settingsResult}
    />
  )
}
