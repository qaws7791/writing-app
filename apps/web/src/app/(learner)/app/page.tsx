import { redirect } from "next/navigation"

import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { HomePage } from "@/features/learner-home/ui/home-page"
import { getLearnerHome } from "@/features/learner-home/server/dal/get-learner-home"
import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import { getServerLearnerSessionToken } from "@/server/auth/server-session-token"

export default async function AppHomeRoute() {
  const token = await getServerLearnerSessionToken()

  if (token === null) {
    redirect(createLoginPagePath("/app"))
  }

  const { inProgressResult, profileResult } = await getLearnerHome(token)
  if (profileResult.status === "error") {
    if (profileResult.error.code === "UNAUTHENTICATED") {
      redirect(createLoginPagePath("/app"))
    }

    return (
      <AppRouteNotice
        description={profileResult.error.message}
        title="홈을 열 수 없습니다."
      />
    )
  }

  if (inProgressResult.status === "error") {
    if (inProgressResult.error.code === "UNAUTHENTICATED") {
      redirect(createLoginPagePath("/app"))
    }

    return (
      <AppRouteNotice
        description={inProgressResult.error.message}
        title="홈을 열 수 없습니다."
      />
    )
  }

  return (
    <HomePage
      inProgress={inProgressResult.value}
      learnerName={profileResult.value.user.name}
      profileStats={profileResult.value.stats}
    />
  )
}
