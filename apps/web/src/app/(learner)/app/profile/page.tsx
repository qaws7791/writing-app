import { redirect } from "next/navigation"

import { AppRouteNotice } from "@/components/app-route-notice"
import { ProfilePage } from "@/features/profile/profile-page"
import {
  describeRouteApiFailure,
  toRouteApiOutcome,
} from "@/lib/api/route-api-outcome"
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
  const profileOutcome = toRouteApiOutcome(profileResult)

  if (profileOutcome.status === "error") {
    if (profileOutcome.failure.kind === "authentication") {
      redirect(createLoginPagePath("/app/profile"))
    }

    return (
      <AppRouteNotice
        description={describeRouteApiFailure(profileOutcome.failure)}
        title="프로필을 불러올 수 없습니다."
      />
    )
  }

  return <ProfilePage profile={profileOutcome.value} />
}
