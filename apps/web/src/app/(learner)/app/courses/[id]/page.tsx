import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { cache } from "react"
import { getCourseDetail } from "@workspace/http-client/learner"

import { AppRouteNotice } from "@/shared/ui/app-route-notice"
import { CourseDetailPage } from "@/features/course-detail/ui/course-detail-page"
import { parseCourseDetailRouteParams } from "@/features/course-detail/model/course-detail-route-params"
import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import {
  isLearnerApiAuthenticationError,
  readLearnerApiErrorCode,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"
import { getServerLearnerRequestOptions } from "@/server/http/learner-api-client"

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
  const result = await readCourseDetail(id)
  if (result === null || result.status === "error") {
    return unavailableCourseMetadata()
  }

  const course = result.value
  const coursePath = `/app/courses/${encodeURIComponent(course.id)}`
  const imagePath =
    course.cover?.url ?? `/course-thumbnails/${course.visualKey}.png`
  const imageAlt = course.cover?.altText ?? course.title

  return {
    alternates: { canonical: coursePath },
    description: course.description,
    openGraph: {
      description: course.description,
      images: [{ alt: imageAlt, url: imagePath }],
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
  const courseResult = await readCourseDetail(id)
  if (courseResult === null) {
    redirect(createLoginPagePath(nextPath))
  }

  if (courseResult.status === "error") {
    if (isLearnerApiAuthenticationError(courseResult.error)) {
      redirect(createLoginPagePath(nextPath))
    }

    if (readLearnerApiErrorCode(courseResult.error) === "COURSE_NOT_FOUND") {
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

const readCourseDetail = cache(async (courseId: string) => {
  const requestOptions = await getServerLearnerRequestOptions({
    cache: "no-store",
  })
  if (requestOptions === null) return null

  return settleLearnerApiRequest(getCourseDetail(courseId, requestOptions))
})
