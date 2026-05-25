import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getDefaultLesson, getLessonById } from "@/features/lessons/lesson-data"
import { LessonPage } from "@/features/lessons/lesson-page"

type LessonRouteProps = {
  searchParams: Promise<{
    lesson_id?: string | string[]
  }>
}

export async function generateMetadata({
  searchParams,
}: LessonRouteProps): Promise<Metadata> {
  const lesson = resolveLesson(await searchParams)

  if (!lesson) {
    return {
      title: "레슨을 찾을 수 없습니다 — 한글쓰기",
      description: "요청한 한국어 글쓰기 레슨을 찾을 수 없습니다.",
    }
  }

  return {
    title: `${lesson.title} — 한글쓰기`,
    description: "한국어 글쓰기 레슨을 단계별로 학습합니다.",
  }
}

export default async function Page({ searchParams }: LessonRouteProps) {
  const lesson = resolveLesson(await searchParams)

  if (!lesson) {
    notFound()
  }

  return <LessonPage lesson={lesson} />
}

function resolveLesson(
  searchParams: Awaited<LessonRouteProps["searchParams"]>
) {
  const lessonIdParam = getLessonIdParam(searchParams.lesson_id)

  if (!lessonIdParam) {
    return getDefaultLesson()
  }

  return getLessonById(lessonIdParam)
}

function getLessonIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
