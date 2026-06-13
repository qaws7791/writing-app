"use client"

/* eslint-disable @next/next/no-img-element, react/button-has-type */

import { useRouter } from "next/navigation"

import { CourseCurriculum } from "@/features/courses/course-curriculum"
import { createCourseImageUrl } from "@/features/courses/course-image-url"
import type {
  CourseDetail,
  CourseLessonSummary,
  ProgressCourse,
  ProgressLesson,
} from "@/features/courses/course-types"
import { ChevronLeftIcon } from "@workspace/ui/components/icons"

type CourseDetailPageProps = {
  readonly course: CourseDetail
  readonly progressCourse?: ProgressCourse
}

type NextLesson = CourseLessonSummary & {
  readonly progressStatus: ProgressLesson["status"]
}

export function CourseDetailPage({
  course,
  progressCourse,
}: CourseDetailPageProps) {
  const router = useRouter()
  const completedLessonCount = resolveCompletedLessonCount(
    course,
    progressCourse
  )
  const totalLessonCount = course.progress.totalLessons
  const progressPercent =
    totalLessonCount === 0 ? 0 : (completedLessonCount / totalLessonCount) * 100
  const nextLesson = resolveNextLesson(course, progressCourse)

  return (
    <div className="max-w-3xl mx-auto">
      <button
        className="flex items-center text-muted font-bold mb-8 hover:text-charcoal btn-squish w-fit"
        onClick={() => router.push("/app/courses")}
      >
        <ChevronLeftIcon className="mr-1" size={20} />
        돌아가기
      </button>
      <div className="bg-surface -mx-3 md:mx-0 rounded-4xl px-5 py-8 md:p-10 mb-12">
        <div className="flex items-start justify-between gap-4 mb-6">
          <img
            alt={course.title}
            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl object-cover shrink-0"
            src={createCourseImageUrl(course.id, 240, 240)}
          />
        </div>
        <h1
          className="font-bold mb-4"
          style={{ fontSize: "2.5rem", lineHeight: 1.2 }}
        >
          {course.title}
        </h1>
        <p
          className="text-charcoal font-medium leading-relaxed mb-8"
          style={{ fontSize: "1.125rem" }}
        >
          {course.description}
        </p>
        <div className="flex items-center gap-6 mb-10">
          <div className="flex-1 bg-charcoal/20 h-4 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-black" style={{ fontSize: "1.125rem" }}>
            {completedLessonCount}/{totalLessonCount}
          </span>
        </div>
        {nextLesson === undefined ? null : (
          <div>
            <p
              className="text-muted font-bold mb-4"
              style={{ fontSize: "0.875rem" }}
            >
              {completedLessonCount > 0 ? "다음 레슨" : "첫 번째 레슨"}:{" "}
              {nextLesson.title}
            </p>
            <button
              className="w-full md:w-auto px-10 py-5 bg-charcoal text-cream font-bold rounded-full btn-squish"
              onClick={() =>
                router.push(`/app/lesson?lesson_id=${nextLesson.id}`)
              }
              style={{ fontSize: "1.125rem" }}
            >
              {completedLessonCount > 0 ? "이어서 학습하기" : "학습 시작하기"}
            </button>
          </div>
        )}
      </div>
      <CourseCurriculum course={course} progressCourse={progressCourse} />
    </div>
  )
}

function resolveCompletedLessonCount(
  course: CourseDetail,
  progressCourse: ProgressCourse | undefined
): number {
  return (
    progressCourse?.lessons.filter((lesson) => lesson.status === "completed")
      .length ?? course.progress.completedLessons
  )
}

function resolveNextLesson(
  course: CourseDetail,
  progressCourse: ProgressCourse | undefined
): NextLesson | undefined {
  const lessons = course.units.flatMap((unit) => unit.lessons)

  return lessons
    .map((lesson) => ({
      ...lesson,
      progressStatus:
        progressCourse?.lessons.find(
          (progressLesson) => progressLesson.id === lesson.id
        )?.status ?? "locked",
    }))
    .find((lesson) => lesson.progressStatus === "available")
}
