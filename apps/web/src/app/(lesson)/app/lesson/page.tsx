import { redirect } from "next/navigation"

import { AppRouteNotice } from "@/components/app-route-notice"
import { LessonExperience } from "@/features/lessons/lesson-experience"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"
import { createLoginPagePath } from "@/lib/auth/auth-navigation"
import { getServerLearnerSessionToken } from "@/lib/auth/server-session-token"

type LessonRouteProps = {
  readonly searchParams: Promise<{
    readonly lesson_id?: string | string[]
  }>
}

export default async function LessonRoute({ searchParams }: LessonRouteProps) {
  const { lesson_id: lessonIdParameter } = await searchParams
  const lessonId = Array.isArray(lessonIdParameter)
    ? lessonIdParameter[0]
    : lessonIdParameter
  const token = await getServerLearnerSessionToken()

  if (token === null) {
    const requestedLessonPath =
      lessonId === undefined || lessonId.trim() === ""
        ? "/app/lesson"
        : `/app/lesson?lesson_id=${encodeURIComponent(lessonId)}`
    redirect(createLoginPagePath(requestedLessonPath))
  }

  if (lessonId === undefined || lessonId.trim() === "") {
    return (
      <AppRouteNotice
        description="코스에서 이어갈 레슨을 선택해 주세요."
        title="레슨을 찾을 수 없습니다."
      />
    )
  }

  const nextPath = `/app/lesson?lesson_id=${encodeURIComponent(lessonId)}`
  const api = getServerWritingAppApi({
    tokenProvider: () => token,
  })
  const [lessonResult, profileResult] = await Promise.all([
    api.getLesson(lessonId),
    api.getProfile(),
  ])
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
