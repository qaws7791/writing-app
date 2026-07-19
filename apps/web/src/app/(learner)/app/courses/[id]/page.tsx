import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { CourseDetailPage } from "@/features/course-detail/ui/course-detail-page"
import { parseCourseDetailRouteParams } from "@/features/course-detail/model/course-detail-route-params"
import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import { getServerLearnerSessionToken } from "@/server/auth/server-session-token"
import { getCachedCourseDetail } from "@/features/course-detail/server/dal/cached-course-detail"

type CourseDetailRouteProps = {
  readonly params: Promise<{
    readonly id: string
  }>
}

export async function generateMetadata({
  params,
}: CourseDetailRouteProps): Promise<Metadata> {
  const parsedParams = parseCourseDetailRouteParams(await params)
  if (parsedParams === null) return unavailableCourseMetadata()
  const { id } = parsedParams
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
  const parsedParams = parseCourseDetailRouteParams(await params)
  if (parsedParams === null) notFound()
  const { id } = parsedParams
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
