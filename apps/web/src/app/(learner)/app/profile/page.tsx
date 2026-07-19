import { redirect } from "next/navigation"

import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { ProfileLogoutButton } from "@/app/(learner)/app/profile/_views/profile-logout-button"
import { ProfilePage } from "@/features/learner-profile/ui/profile-page"
import { getLearnerProfile } from "@/features/learner-profile/server/dal/get-learner-profile"
import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import { getServerLearnerSessionToken } from "@/server/auth/server-session-token"

export default async function ProfileRoute() {
  const token = await getServerLearnerSessionToken()

  if (token === null) {
    redirect(createLoginPagePath("/app/profile"))
  }

  const profileResult = await getLearnerProfile(token)
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

  return (
    <ProfilePage
      logoutAction={
        <ProfileLogoutButton learnerId={profileResult.value.user.id} />
      }
      profile={profileResult.value}
    />
  )
}
