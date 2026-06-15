import { redirect } from "next/navigation"

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
    redirect(createLoginPagePath("/app/profile"))
  }

  return <ProfilePage profile={profileResult.value} />
}
