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
  const [profileResult, progressResult] = await Promise.all([
    api.getProfile(),
    api.getProgress(),
  ])
  const profileOutcome = toRouteApiOutcome(profileResult)
  const progressOutcome = toRouteApiOutcome(progressResult)

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

  if (progressOutcome.status === "error") {
    if (progressOutcome.failure.kind === "authentication") {
      redirect(createLoginPagePath("/app"))
    }

    return (
      <AppRouteNotice
        description={describeRouteApiFailure(progressOutcome.failure)}
        title="홈을 열 수 없습니다."
      />
    )
  }

  return (
    <HomePage
      learnerName={profileOutcome.value.user.name}
      progress={progressOutcome.value}
    />
  )
}
