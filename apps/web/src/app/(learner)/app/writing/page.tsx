import { redirect } from "next/navigation"
import { getWritings } from "@workspace/http-client/learner"

import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import { WritingHomePage } from "@/features/writing/ui/writing-home-page"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"
import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { getServerLearnerRequestOptions } from "@/server/http/learner-api-client"

export default async function WritingHomeRoute() {
  const requestOptions = await getServerLearnerRequestOptions({
    cache: "no-store",
  })

  if (requestOptions === null) {
    redirect(createLoginPagePath("/app/writing"))
  }

  const result = await settleLearnerApiRequest(getWritings(requestOptions))
  if (result.status === "error") {
    if (isLearnerApiAuthenticationError(result.error)) {
      redirect(createLoginPagePath("/app/writing"))
    }

    return (
      <AppRouteNotice
        description="저장한 글을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요."
        linkHref="/app"
        linkLabel="홈으로"
        title="쓰기를 열 수 없습니다."
      />
    )
  }

  return <WritingHomePage initialWritings={result.value.items} />
}
