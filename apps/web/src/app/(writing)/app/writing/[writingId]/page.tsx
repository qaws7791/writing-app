import { redirect } from "next/navigation"
import { getProfile, getWriting } from "@workspace/http-client/learner"

import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import { WritingStudio } from "@/features/writing/ui/writing-studio"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"
import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { getServerLearnerRequestOptions } from "@/server/http/learner-api-client"

export default async function WritingStudioRoute({
  params,
}: {
  readonly params: Promise<{ readonly writingId: string }>
}) {
  const [{ writingId }, requestOptions] = await Promise.all([
    params,
    getServerLearnerRequestOptions({ cache: "no-store" }),
  ])
  const studioPath = `/app/writing/${encodeURIComponent(writingId)}`

  if (requestOptions === null) {
    redirect(createLoginPagePath(studioPath))
  }

  const [writingResult, profileResult] = await Promise.all([
    settleLearnerApiRequest(getWriting(writingId, requestOptions)),
    settleLearnerApiRequest(getProfile(requestOptions)),
  ])
  if (writingResult.status === "error") {
    if (isLearnerApiAuthenticationError(writingResult.error)) {
      redirect(createLoginPagePath(studioPath))
    }

    return (
      <AppRouteNotice
        description="글을 찾을 수 없거나 불러오지 못했습니다. 쓰기 홈에서 다시 선택해 주세요."
        linkHref="/app/writing"
        linkLabel="쓰기 홈으로"
        title="글을 열 수 없습니다."
      />
    )
  }

  if (profileResult.status === "error") {
    if (isLearnerApiAuthenticationError(profileResult.error)) {
      redirect(createLoginPagePath(studioPath))
    }

    return (
      <AppRouteNotice
        description="글을 열 수 없습니다. 잠시 뒤 다시 시도해 주세요."
        linkHref="/app/writing"
        linkLabel="쓰기 홈으로"
        title="글을 열 수 없습니다."
      />
    )
  }

  return (
    <WritingStudio
      initialWriting={writingResult.value}
      learnerId={profileResult.value.user.id}
    />
  )
}
