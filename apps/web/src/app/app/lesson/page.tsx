import Link from "next/link"

import { LessonExperience } from "@/features/lessons/lesson-experience"
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

  const api = getServerWritingAppApi({
    tokenProvider: () => null,
  })
  const lessonResult = await api.getLesson(lessonId)

  if (lessonResult.status === "error") {
    return (
      <LessonRouteNotice
        description="레슨 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        title="레슨을 열 수 없습니다."
      />
    )
  }

  return <LessonExperience lesson={lessonResult.value} />
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
