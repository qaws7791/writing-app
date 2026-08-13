import { redirect } from "next/navigation"
import { getWritingTaskCatalog } from "@workspace/http-client/learner"

import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import { WritingCatalogPage } from "@/features/writing/ui/writing-catalog-page"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"
import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { getServerLearnerRequestOptions } from "@/server/http/learner-api-client"

export default async function WritingCatalogRoute() {
  const requestOptions = await getServerLearnerRequestOptions({
    cache: "no-store",
  })

  if (requestOptions === null) {
    redirect(createLoginPagePath("/app/writing/catalog"))
  }

  const result = await settleLearnerApiRequest(
    getWritingTaskCatalog({}, requestOptions)
  )
  if (result.status === "error") {
    if (isLearnerApiAuthenticationError(result.error)) {
      redirect(createLoginPagePath("/app/writing/catalog"))
    }

    return (
      <AppRouteNotice
        description="과제를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요."
        linkHref="/app/writing"
        linkLabel="쓰기 홈으로"
        title="과제를 열 수 없습니다."
      />
    )
  }

  return <WritingCatalogPage initialTasks={result.value.items} />
}
