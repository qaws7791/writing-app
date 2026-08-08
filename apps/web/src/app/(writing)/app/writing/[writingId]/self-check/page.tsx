import { redirect } from "next/navigation"
import { getWriting } from "@workspace/http-client/learner"

import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import { WritingSelfCheck } from "@/features/focused-writing/ui/writing-self-check"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"
import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { getServerLearnerRequestOptions } from "@/server/http/learner-api-client"

export default async function WritingSelfCheckRoute({
  params,
}: {
  readonly params: Promise<{ readonly writingId: string }>
}) {
  const [{ writingId }, requestOptions] = await Promise.all([
    params,
    getServerLearnerRequestOptions({ cache: "no-store" }),
  ])
  const selfCheckPath = `/app/writing/${encodeURIComponent(writingId)}/self-check`

  if (requestOptions === null) {
    redirect(createLoginPagePath(selfCheckPath))
  }

  const result = await settleLearnerApiRequest(
    getWriting(writingId, requestOptions)
  )
  if (result.status === "error") {
    if (isLearnerApiAuthenticationError(result.error)) {
      redirect(createLoginPagePath(selfCheckPath))
    }

    return (
      <AppRouteNotice
        description="글을 찾을 수 없거나 불러오지 못했습니다. 쓰기 홈에서 다시 선택해 주세요."
        linkHref="/app/writing"
        linkLabel="쓰기 홈으로"
        title="자기 점검을 열 수 없습니다."
      />
    )
  }

  if (result.value.selfCheckStartedAt === null) {
    redirect(`/app/writing/${encodeURIComponent(writingId)}`)
  }

  return <WritingSelfCheck initialWriting={result.value} />
}
