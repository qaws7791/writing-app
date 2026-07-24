import { redirect } from "next/navigation"
import { getProfile } from "@workspace/http-client/learner"

import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { ProfileLogoutButton } from "@/app/(learner)/app/profile/_views/profile-logout-button"
import { ProfilePage } from "@/features/learner-profile/ui/profile-page"
import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"
import { getServerLearnerRequestOptions } from "@/server/http/learner-api-client"

export default async function ProfileRoute() {
  const requestOptions = await getServerLearnerRequestOptions({
    cache: "no-store",
  })

  if (requestOptions === null) {
    redirect(createLoginPagePath("/app/profile"))
  }

  const profileResult = await settleLearnerApiRequest(
    getProfile(requestOptions)
  )
  if (profileResult.status === "error") {
    if (isLearnerApiAuthenticationError(profileResult.error)) {
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
      logoutAction={<ProfileLogoutButton />}
      profile={profileResult.value}
    />
  )
}
