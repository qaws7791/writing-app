import type { Metadata } from "next"

import { CoursesPage } from "@/features/courses/courses-page"

export const metadata: Metadata = {
  title: "배우기 — 한글쓰기",
  description:
    "체계적인 커리큘럼으로 한국어 글쓰기 실력을 키워보세요. 문장 구조, 문법, 에세이, 비즈니스 글쓰기까지 다양한 코스를 탐색하세요.",
}

export default function Page() {
  return <CoursesPage />
}
