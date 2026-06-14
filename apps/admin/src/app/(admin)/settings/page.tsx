import { AdminSettingsPage } from "@/features/settings/admin-settings-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminSettingsRoute() {
  const api = getServerAdminApi({
    tokenProvider: getServerAdminSessionToken,
  })
  const settingsResult = await api.getSettings()

  async function saveNoticeSettings(input: {
    readonly announce: string
    readonly banner: string
  }) {
    "use server"

    const serverApi = getServerAdminApi({
      tokenProvider: getServerAdminSessionToken,
    })

    return serverApi.saveNoticeSettings(input)
  }

  async function saveLegalSettings(input: {
    readonly privacy: string
    readonly terms: string
  }) {
    "use server"

    const serverApi = getServerAdminApi({
      tokenProvider: getServerAdminSessionToken,
    })

    return serverApi.saveLegalSettings(input)
  }

  async function resetContent() {
    "use server"

    const serverApi = getServerAdminApi({
      tokenProvider: getServerAdminSessionToken,
    })

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
