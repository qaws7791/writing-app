import Image from "next/image"
import Link from "next/link"

import type {
  LearnerLessonReference,
  LearnerProgressCourse,
} from "@workspace/contracts/learning"
import {
  ChevronRightIcon,
  PlayIcon,
  SparklesIcon,
} from "@workspace/ui/components/icons"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import { Progress } from "@workspace/ui/components/ui/progress"
import { Surface } from "@workspace/ui/components/ui/surface"

import { createCourseImageUrl } from "@/entities/course/model/course-visual-assets"

export function StartCourseCta() {
  return (
    <Link
      className="block cursor-pointer rounded-panel bg-surface p-7"
      href="/app/courses"
    >
      <div className="flex items-center gap-2 mb-5">
        <SparklesIcon className="text-muted-foreground" size={16} />
        <span className="text-label-md font-bold text-muted-foreground">
          지금 시작해볼까요?
        </span>
      </div>
      <h2 className="mb-7 text-heading-sm font-black">
        새로운 코스를
        <br />
        선택해 보세요
      </h2>
      <div
        className={buttonVariants({
          className: "w-full justify-between",
          size: "lg",
        })}
      >
        <span>코스 둘러보기</span>
        <ChevronRightIcon size={20} />
      </div>
    </Link>
  )
}

export function ContinueCourseCard({
  course,
  priority = false,
}: {
  readonly course: LearnerProgressCourse
  readonly priority?: boolean
}) {
  const completedLessonCount = course.learning.completedLessons
  const totalLessonCount = course.learning.totalLessons
  const progressPercent = course.learning.progressPercent
  const nextLesson = course.learning.nextLesson
  const courseHref = `/app/courses/${course.id}`

  return (
    <Surface
      variant="panel"
      size="none"
      className="flex w-full min-w-0 flex-col overflow-hidden rounded-[28px] select-none lg:rounded-[24px]"
    >
      <Link
        className="flex w-full cursor-pointer flex-col text-left lg:flex-row"
        href={courseHref}
      >
        <div className="relative h-36 w-full shrink-0 overflow-hidden lg:h-28 lg:min-h-28 lg:w-44">
          <Image
            alt={course.title}
            className="object-cover pointer-events-none"
            draggable={false}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 176px, 100vw"
            src={createCourseImageUrl(course.visualKey)}
          />
        </div>
        <div className="px-6 pt-5 pb-4 lg:min-w-0 lg:flex-1 lg:px-5 lg:py-4">
          <ContinueCourseSummary
            completedLessonCount={completedLessonCount}
            course={course}
            progressPercent={progressPercent}
            totalLessonCount={totalLessonCount}
          />
        </div>
      </Link>
      <div className="flex flex-col gap-1 px-3 pb-4 lg:gap-0.5 lg:py-3">
        {nextLesson !== null ? (
          <NextLessonLink lesson={nextLesson} />
        ) : (
          <div className="px-4 py-3 text-label-md font-bold text-muted-foreground">
            모든 레슨을 완료했어요
          </div>
        )}
      </div>
    </Surface>
  )
}

function ContinueCourseSummary({
  completedLessonCount,
  course,
  progressPercent,
  totalLessonCount,
}: {
  readonly completedLessonCount: number
  readonly course: LearnerProgressCourse
  readonly progressPercent: number
  readonly totalLessonCount: number
}) {
  return (
    <>
      <p
        className="mb-3 text-title-md font-bold lg:text-body-md"
        style={{
          display: "-webkit-box",
          overflow: "hidden",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
        }}
      >
        {course.title}
      </p>
      <Progress
        aria-label={`${course.title} 진행률`}
        className="items-center gap-3"
        indicatorClassName="bg-charcoal"
        trackClassName="h-2 bg-charcoal/10"
        value={progressPercent}
      >
        <span className="shrink-0 text-label-sm font-bold text-muted-foreground">
          {completedLessonCount}/{totalLessonCount}
        </span>
      </Progress>
    </>
  )
}

function NextLessonLink({
  lesson,
}: {
  readonly lesson: LearnerLessonReference
}) {
  return (
    <Link
      className="flex items-center gap-4 rounded-2xl px-4 py-3.5 text-left hover:bg-surface-hover lg:gap-3 lg:px-3 lg:py-3"
      href={`/app/lesson?lesson_id=${encodeURIComponent(lesson.id)}`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground lg:size-8">
        <PlayIcon className="size-3.5 lg:size-3" fill="currentColor" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-body-md font-bold lg:text-body-sm">
          {lesson.title}
        </span>
        <span className="mt-1 block text-label-sm font-bold text-muted-foreground lg:mt-0.5">
          {lesson.estimatedMinutes}분
        </span>
      </span>
    </Link>
  )
}
