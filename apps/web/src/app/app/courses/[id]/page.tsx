import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { courseId } from "@/features/courses/course-ids"
import { CourseDetailPage } from "@/features/courses/course-detail-page"
import { isServerFakeApiMode } from "@/lib/api/api-mode"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

type CoursePageProps = {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  if (!isServerFakeApiMode()) {
    return []
  }

  const { getCourseDetailStaticParams } =
    await import("@/features/courses/course-detail-data")

  return getCourseDetailStaticParams()
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { id } = await params
  const course = await getCourseMetadataSource(id)

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
  const api = await getServerWritingAppApi()
  const [course, curriculumUpgrade] = await Promise.all([
    api.getCourseDetail(courseId(id)),
    api.getCurriculumUpgrade(courseId(id)),
  ])

  if (course.status === "error") {
    if (course.error.code === "not-found") {
      notFound()
    }

    throw new Error(course.error.message)
  }

  return (
    <CourseDetailPage
      course={course.value}
      curriculumUpgrade={
        curriculumUpgrade.status === "ok" ? curriculumUpgrade.value : undefined
      }
    />
  )
}

async function getCourseMetadataSource(id: string) {
  if (isServerFakeApiMode()) {
    const { getCourseDetailById } =
      await import("@/features/courses/course-detail-data")

    return getCourseDetailById(id)
  }

  const api = await getServerWritingAppApi()
  const course = await api.getCourseDetail(courseId(id))

  if (course.status === "error") {
    return undefined
  }

  return course.value
}
