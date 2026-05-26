import { redirect } from "next/navigation"

type LessonRouteProps = {
  searchParams: Promise<{
    lesson_id?: string | string[]
  }>
}

export default async function Page({ searchParams }: LessonRouteProps) {
  const lessonId = getLessonIdParam((await searchParams).lesson_id)
  const suffix = lessonId ? `?lesson_id=${encodeURIComponent(lessonId)}` : ""

  redirect(`/app/lesson${suffix}`)
}

function getLessonIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
