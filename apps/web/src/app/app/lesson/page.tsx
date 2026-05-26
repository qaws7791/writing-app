import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getDefaultLesson, lessonId } from "@/features/lessons/lesson-data"
import { LessonPage } from "@/features/lessons/lesson-page"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

type LessonRouteProps = {
  searchParams: Promise<{
    lesson_id?: string | string[]
  }>
}

export async function generateMetadata({
  searchParams,
}: LessonRouteProps): Promise<Metadata> {
  const lessonIdParam = getLessonIdParam((await searchParams).lesson_id)
  const api = await getServerWritingAppApi()
  const lesson = lessonIdParam
    ? await api.getLesson(lessonId(lessonIdParam))
    : await api.getLesson(getDefaultLesson().id)

  if (lesson.status === "error") {
    return {
      title: "레슨을 찾을 수 없습니다 — 한글쓰기",
      description: "요청한 한국어 글쓰기 레슨을 찾을 수 없습니다.",
    }
  }

  return {
    title: `${lesson.value.title} — 한글쓰기`,
    description: "한국어 글쓰기 레슨을 단계별로 학습합니다.",
  }
}

export default async function Page({ searchParams }: LessonRouteProps) {
  const lessonIdParam = getLessonIdParam((await searchParams).lesson_id)
  const api = await getServerWritingAppApi()
  const lesson = lessonIdParam
    ? await api.getLesson(lessonId(lessonIdParam))
    : await api.getLesson(getDefaultLesson().id)

  if (lesson.status === "error") {
    if (lesson.error.code === "not-found") {
      notFound()
    }

    throw new Error(lesson.error.message)
  }

  return <LessonPage lesson={lesson.value} />
}

function getLessonIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
