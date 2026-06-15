import { redirect } from "next/navigation"

import { AppRouteNotice } from "@/components/app-route-notice"
import { LessonExperience } from "@/features/lessons/lesson-experience"
import { createLoginPagePath } from "@/lib/auth/auth-navigation"
import { getServerLearnerSessionToken } from "@/lib/auth/server-session-token"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

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

  if (lessonId === undefined || lessonId.trim() === "") {
    return (
      <AppRouteNotice
        description="코스에서 이어갈 레슨을 선택해 주세요."
        title="레슨을 찾을 수 없습니다."
      />
    )
  }

  const nextPath = `/app/lesson?lesson_id=${encodeURIComponent(lessonId)}`
  const token = await getServerLearnerSessionToken()

  if (token === null) {
    redirect(createLoginPagePath(nextPath))
  }

  const api = getServerWritingAppApi({
    tokenProvider: () => token,
  })
  const lessonResult = await api.getLesson(lessonId)

  if (lessonResult.status === "error") {
    return (
      <AppRouteNotice
        description="레슨 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        title="레슨을 열 수 없습니다."
      />
    )
  }

  const lesson = lessonResult.value
  const courseDetailResult = await api.getCourseDetail(lesson.courseId)
  const courseDetail =
    courseDetailResult.status === "ok" ? courseDetailResult.value : undefined

  return <LessonExperience courseDetail={courseDetail} lesson={lesson} />
}
