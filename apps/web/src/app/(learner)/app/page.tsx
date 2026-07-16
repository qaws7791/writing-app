import { redirect } from "next/navigation"

import { AppRouteNotice } from "@/components/app-route-notice"
import { HomePage } from "@/features/home/home-page"
import { createLoginPagePath } from "@/lib/auth/auth-navigation"
import { getServerLearnerSessionToken } from "@/lib/auth/server-session-token"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

export default async function AppHomeRoute() {
  const token = await getServerLearnerSessionToken()

  if (token === null) {
    redirect(createLoginPagePath("/app"))
  }

  const api = getServerWritingAppApi({
    tokenProvider: () => token,
  })
  const [profileResult, inProgressResult] = await Promise.all([
    api.getProfile(),
    api.getProgress({ status: "in_progress" }),
  ])
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
