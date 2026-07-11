import { redirect } from "next/navigation"

import { AppRouteNotice } from "@/components/app-route-notice"
import type { ProgressCourseList } from "@/features/courses/course-types"
import { LessonExperience } from "@/features/lessons/lesson-experience"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"
import {
  describeRouteApiFailure,
  readOptionalRouteApiValue,
  toRouteApiOutcome,
} from "@/lib/api/route-api-outcome"
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
  const lessonPromise = api.getLesson(lessonId)
  const progressPromise = api.getProgress()
  const profilePromise = api.getProfile()
  const lessonResult = await lessonPromise
  const lessonOutcome = toRouteApiOutcome(lessonResult)

  if (lessonOutcome.status === "error") {
    if (lessonOutcome.failure.kind === "authentication") {
      redirect(createLoginPagePath(nextPath))
    }

    return (
      <AppRouteNotice
        description={describeRouteApiFailure(lessonOutcome.failure)}
        title="레슨을 열 수 없습니다."
      />
    )
  }

  const lesson = lessonOutcome.value
  const [courseDetailResult, progressResult, profileResult] = await Promise.all(
    [api.getCourseDetail(lesson.courseId), progressPromise, profilePromise]
  )
  const profileOutcome = toRouteApiOutcome(profileResult)

  if (profileOutcome.status === "error") {
    if (profileOutcome.failure.kind === "authentication") {
      redirect(createLoginPagePath(nextPath))
    }

    return (
      <AppRouteNotice
        description={describeRouteApiFailure(profileOutcome.failure)}
        title="학습자 정보를 확인할 수 없습니다."
      />
    )
  }
  const courseDetail = readOptionalRouteApiValue(courseDetailResult)
  const progress = readOptionalRouteApiValue(progressResult)
  const initialProgress =
    progress !== undefined
      ? resolveInitialLessonProgress(progress, lesson.id)
      : undefined

  return (
    <LessonExperience
      courseDetail={courseDetail}
      initialProgress={initialProgress}
      lesson={lesson}
      learnerId={profileOutcome.value.user.id}
    />
  )
}

function resolveInitialLessonProgress(
  progress: ProgressCourseList,
  lessonId: string
): { readonly currentStepIndex: number } | undefined {
  const progressLesson = progress.courses
    .flatMap((course) => course.lessons)
    .find((lesson) => lesson.id === lessonId)

  if (
    progressLesson === undefined ||
    progressLesson.status === "completed" ||
    progressLesson.currentStepIndex === null
  ) {
    return undefined
  }

  return {
    currentStepIndex: progressLesson.currentStepIndex,
  }
}
