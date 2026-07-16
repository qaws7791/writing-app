import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { AppRouteNotice } from "@/components/app-route-notice"
import { CourseDetailPage } from "@/features/courses/course-detail-page"
import { createLoginPagePath } from "@/lib/auth/auth-navigation"
import { getServerLearnerSessionToken } from "@/lib/auth/server-session-token"
import { getCachedCourseDetail } from "@/lib/api/cached-course-detail"

type CourseDetailRouteProps = {
  readonly params: Promise<{
    readonly id: string
  }>
}

export async function generateMetadata({
  params,
}: CourseDetailRouteProps): Promise<Metadata> {
  const { id } = await params
  const token = await getServerLearnerSessionToken()
  if (token === null) {
    return unavailableCourseMetadata()
  }

  const result = await getCachedCourseDetail(id, token)
  if (result.status === "error") {
    return unavailableCourseMetadata()
  }

  const course = result.value
  const coursePath = `/app/courses/${encodeURIComponent(course.id)}`
  const imagePath = `/course-thumbnails/${course.visualKey}.png`

  return {
    alternates: { canonical: coursePath },
    description: course.description,
    openGraph: {
      description: course.description,
      images: [{ alt: course.title, url: imagePath }],
      title: course.title,
      type: "article",
      url: coursePath,
    },
    title: course.title,
    twitter: {
      card: "summary_large_image",
      description: course.description,
      images: [imagePath],
      title: course.title,
    },
  }
}

export default async function CourseDetailRoute({
  params,
}: CourseDetailRouteProps) {
  const { id } = await params
  const nextPath = `/app/courses/${id}`
  const token = await getServerLearnerSessionToken()

  if (token === null) {
    redirect(createLoginPagePath(nextPath))
  }

  const courseResult = await getCachedCourseDetail(id, token)
  if (courseResult.status === "error") {
    if (courseResult.error.code === "UNAUTHENTICATED") {
      redirect(createLoginPagePath(nextPath))
    }

    if (courseResult.error.code === "COURSE_NOT_FOUND") {
      notFound()
    }

    return (
      <AppRouteNotice
        description={courseResult.error.message}
        title="코스를 열 수 없습니다."
      />
    )
  }

  return <CourseDetailPage course={courseResult.value} />
}

function unavailableCourseMetadata(): Metadata {
  return {
    robots: { follow: false, index: false },
    title: "코스를 찾을 수 없습니다",
  }
}
