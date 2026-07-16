import { redirect } from "next/navigation"

import { AppRouteNotice } from "@/components/app-route-notice"
import { ProfilePage } from "@/features/profile/profile-page"
import { createLoginPagePath } from "@/lib/auth/auth-navigation"
import { getServerLearnerSessionToken } from "@/lib/auth/server-session-token"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

export default async function ProfileRoute() {
  const token = await getServerLearnerSessionToken()

  if (token === null) {
    redirect(createLoginPagePath("/app/profile"))
  }

  const api = getServerWritingAppApi({
    tokenProvider: () => token,
  })
  const profileResult = await api.getProfile()
  if (profileResult.status === "error") {
    if (profileResult.error.code === "UNAUTHENTICATED") {
      redirect(createLoginPagePath("/app/profile"))
    }

    return (
      <AppRouteNotice
        description={profileResult.error.message}
        title="프로필을 불러올 수 없습니다."
      />
    )
  }

  return <ProfilePage profile={profileResult.value} />
}
