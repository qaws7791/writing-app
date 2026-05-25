import type { Metadata } from "next"

import { prototypeLesson } from "@/features/lessons/lesson-data"
import { LessonPage } from "@/features/lessons/lesson-page"

type LessonRouteProps = {
  searchParams: Promise<{
    lesson_id?: string | string[]
  }>
}

export const metadata: Metadata = {
  title: `${prototypeLesson.title} — 한글쓰기`,
  description: "한국어 글쓰기 레슨을 단계별로 학습합니다.",
}

export default async function Page({ searchParams }: LessonRouteProps) {
  await searchParams

  return <LessonPage lesson={prototypeLesson} />
}
