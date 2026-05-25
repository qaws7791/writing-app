import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getCourseDetailById,
  getCourseDetailStaticParams,
} from "@/features/courses/course-detail-data"
import { CourseDetailPage } from "@/features/courses/course-detail-page"

type CoursePageProps = {
  params: Promise<{ id: string }>
}

export function generateStaticParams() {
  return getCourseDetailStaticParams()
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { id } = await params
  const course = getCourseDetailById(id)

  if (!course) {
    return {
      title: "코스를 찾을 수 없습니다 — 한글쓰기",
    }
  }

  return {
    title: `${course.title} — 한글쓰기`,
    description: course.description,
  }
}

export default async function Page({ params }: CoursePageProps) {
  const { id } = await params
  const course = getCourseDetailById(id)

  if (!course) {
    notFound()
  }

  return <CourseDetailPage course={course} />
}
