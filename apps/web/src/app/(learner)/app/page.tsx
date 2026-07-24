import { redirect } from "next/navigation"
import { getProfile, getProgress } from "@workspace/http-client/learner"

import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { HomePage } from "@/features/learner-home/ui/home-page"
import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"
import { getServerLearnerRequestOptions } from "@/server/http/learner-api-client"

export default async function AppHomeRoute() {
  const requestOptions = await getServerLearnerRequestOptions({
    cache: "no-store",
  })

  if (requestOptions === null) {
    redirect(createLoginPagePath("/app"))
  }

  const [profileResult, inProgressResult] = await Promise.all([
    settleLearnerApiRequest(getProfile(requestOptions)),
    settleLearnerApiRequest(
      getProgress({ status: "in_progress" }, requestOptions)
    ),
  ])
  if (profileResult.status === "error") {
    if (isLearnerApiAuthenticationError(profileResult.error)) {
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
    if (isLearnerApiAuthenticationError(inProgressResult.error)) {
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
