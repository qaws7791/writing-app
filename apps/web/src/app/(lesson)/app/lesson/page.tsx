import { redirect } from "next/navigation"
import { getLesson } from "@workspace/http-client/learner"

import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { LessonExperience } from "@/features/lesson-session/ui/lesson-experience"
import { toLessonViewModel } from "@/features/lesson-session/model/lesson-view-model"
import { parseLessonRouteSearchParams } from "@/features/lesson-session/model/lesson-route-search-params"
import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"
import { getServerLearnerRequestOptions } from "@/server/http/learner-api-client"

type LessonRouteProps = {
  readonly searchParams: Promise<{
    readonly lesson_id?: string | string[]
  }>
}

export default async function LessonRoute({ searchParams }: LessonRouteProps) {
  const [resolvedSearchParams, requestOptions] = await Promise.all([
    searchParams,
    getServerLearnerRequestOptions({ cache: "no-store" }),
  ])
  const { lessonId } = parseLessonRouteSearchParams(resolvedSearchParams)

  if (requestOptions === null) {
    const requestedLessonPath =
      lessonId === undefined
        ? "/app/lesson"
        : `/app/lesson?lesson_id=${encodeURIComponent(lessonId)}`
    redirect(createLoginPagePath(requestedLessonPath))
  }

  if (lessonId === undefined) {
    return (
      <AppRouteNotice
        description="코스에서 이어갈 레슨을 선택해 주세요."
        title="레슨을 찾을 수 없습니다."
      />
    )
  }

  const nextPath = `/app/lesson?lesson_id=${encodeURIComponent(lessonId)}`
  const lessonResult = await settleLearnerApiRequest(
    getLesson(lessonId, requestOptions)
  )
  if (lessonResult.status === "error") {
    if (isLearnerApiAuthenticationError(lessonResult.error)) {
      redirect(createLoginPagePath(nextPath))
    }

    return (
      <AppRouteNotice
        description={lessonResult.error.message}
        title="레슨을 열 수 없습니다."
      />
    )
  }

  const lesson = toLessonViewModel(lessonResult.value)
  return <LessonExperience lesson={lesson} />
}
