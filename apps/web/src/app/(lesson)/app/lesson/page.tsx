import Link from "next/link"
import { redirect } from "next/navigation"

import type { ProgressCourseList } from "@/features/courses/course-types"
import { LessonExperience } from "@/features/lessons/lesson-experience"
import { getFallbackLesson } from "@/features/lessons/kwep-lesson-fallback"
import { createLoginPagePath } from "@/lib/auth/auth-navigation"
import { getServerLearnerSessionToken } from "@/lib/auth/server-session-token"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"

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
      <LessonRouteNotice
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
  const lesson =
    lessonResult.status === "ok"
      ? lessonResult.value
      : getFallbackLesson(lessonId)

  if (lesson === undefined) {
    return (
      <LessonRouteNotice
        description="레슨 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        title="레슨을 열 수 없습니다."
      />
    )
  }

  const [courseDetailResult, progressResult] = await Promise.all([
    api.getCourseDetail(lesson.courseId),
    api.getProgress(),
  ])
  const courseDetail =
    courseDetailResult.status === "ok" ? courseDetailResult.value : undefined
  const initialProgress =
    progressResult.status === "ok"
      ? resolveInitialLessonProgress(progressResult.value, lesson.id)
      : undefined

  return (
    <LessonExperience
      courseDetail={courseDetail}
      initialProgress={initialProgress}
      lesson={lesson}
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

function LessonRouteNotice({
  description,
  title,
}: {
  readonly description: string
  readonly title: string
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl px-6 py-10 sm:px-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle as="h1">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/app/courses"
            >
              코스 둘러보기
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
