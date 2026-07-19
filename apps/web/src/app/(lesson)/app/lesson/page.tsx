import { redirect } from "next/navigation"

import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { LessonExperience } from "@/features/lesson-session/ui/lesson-experience"
import { parseLessonRouteSearchParams } from "@/features/lesson-session/model/lesson-route-search-params"
import { getLessonExperience } from "@/features/lesson-session/server/dal/get-lesson-experience"
import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import { getServerLearnerSessionToken } from "@/server/auth/server-session-token"

type LessonRouteProps = {
  readonly searchParams: Promise<{
    readonly lesson_id?: string | string[]
  }>
}

export default async function LessonRoute({ searchParams }: LessonRouteProps) {
  const { lessonId } = parseLessonRouteSearchParams(await searchParams)
  const token = await getServerLearnerSessionToken()

  if (token === null) {
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
  const { lessonResult, profileResult } = await getLessonExperience({
    lessonId,
    sessionToken: token,
  })
  if (lessonResult.status === "error") {
    if (lessonResult.error.code === "UNAUTHENTICATED") {
      redirect(createLoginPagePath(nextPath))
    }

    return (
      <AppRouteNotice
        description={lessonResult.error.message}
        title="레슨을 열 수 없습니다."
      />
    )
  }

  if (profileResult.status === "error") {
    if (profileResult.error.code === "UNAUTHENTICATED") {
      redirect(createLoginPagePath(nextPath))
    }

    return (
      <AppRouteNotice
        description={profileResult.error.message}
        title="학습자 정보를 확인할 수 없습니다."
      />
    )
  }
  const lesson = lessonResult.value
  return (
    <LessonExperience lesson={lesson} learnerId={profileResult.value.user.id} />
  )
}
