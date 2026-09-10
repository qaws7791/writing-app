import { redirect } from "next/navigation"
import { getWritingTaskCatalog } from "@workspace/http-client/learner"
import { writingCatalogQuerySchema } from "@workspace/contracts/writing/writing"

import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import { WritingCatalogPage } from "@/features/writing/ui/writing-catalog-page"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"
import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { getServerLearnerRequestOptions } from "@/server/http/learner-api-client"

export default async function WritingCatalogRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = writingCatalogQuerySchema.parse(await searchParams)
  const requestOptions = await getServerLearnerRequestOptions({
    cache: "no-store",
  })

  if (requestOptions === null) {
    redirect(createLoginPagePath("/app/writing/catalog"))
  }

  const result = await settleLearnerApiRequest(
    getWritingTaskCatalog(
      {
        direction: query.direction,
        pageSize: query.pageSize,
        ...(query.cursor === undefined ? {} : { cursor: query.cursor }),
        ...(query.domain === undefined ? {} : { domain: query.domain }),
        ...(query.typeName === undefined ? {} : { typeName: query.typeName }),
      },
      requestOptions
    )
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

  return (
    <WritingCatalogPage
      filters={{ domain: query.domain, typeName: query.typeName }}
      initialTasks={result.value.items}
      pagination={result.value.pagination}
    />
  )
}
