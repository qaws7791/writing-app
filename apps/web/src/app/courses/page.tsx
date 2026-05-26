import type { Metadata } from "next"

import { CoursesPage } from "@/features/courses/courses-page"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

export const metadata: Metadata = {
  title: "배우기 — 한글쓰기",
  description:
    "체계적인 커리큘럼으로 한국어 글쓰기 실력을 키워보세요. 문장 구조, 문법, 에세이, 비즈니스 글쓰기까지 다양한 코스를 탐색하세요.",
}

export default async function Page() {
  const api = getServerWritingAppApi()
  const categories = await api.listCourseCategories()

  if (categories.status === "error") {
    throw new Error(categories.error.message)
  }

  return <CoursesPage categories={categories.value} />
}
