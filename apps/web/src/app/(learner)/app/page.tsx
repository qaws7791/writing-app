import { redirect } from "next/navigation"

import { AppRouteNotice } from "@/components/app-route-notice"
import { HomePage } from "@/features/home/home-page"
import {
  describeRouteApiFailure,
  toRouteApiOutcome,
} from "@/lib/api/route-api-outcome"
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
  const profileOutcome = toRouteApiOutcome(profileResult)
  const inProgressOutcome = toRouteApiOutcome(inProgressResult)

  if (profileOutcome.status === "error") {
    if (profileOutcome.failure.kind === "authentication") {
      redirect(createLoginPagePath("/app"))
    }

    return (
      <AppRouteNotice
        description={describeRouteApiFailure(profileOutcome.failure)}
        title="홈을 열 수 없습니다."
      />
    )
  }

  if (inProgressOutcome.status === "error") {
    if (inProgressOutcome.failure.kind === "authentication") {
      redirect(createLoginPagePath("/app"))
    }

    return (
      <AppRouteNotice
        description={describeRouteApiFailure(inProgressOutcome.failure)}
        title="홈을 열 수 없습니다."
      />
    )
  }

  return (
    <HomePage
      inProgress={inProgressOutcome.value}
      learnerName={profileOutcome.value.user.name}
      profileStats={profileOutcome.value.stats}
    />
  )
}
