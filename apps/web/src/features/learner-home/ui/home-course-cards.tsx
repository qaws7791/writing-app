import Image from "next/image"
import Link from "next/link"

import type { LearnerProgressCourseDto } from "@/shared/http/learner-api-client"
import {
  ChevronRightIcon,
  PlayIcon,
  SparklesIcon,
} from "@workspace/ui/components/icons/action-icons"
import {
  Card,
  CardContent,
  cardVariants,
} from "@workspace/ui/components/ui/card"
import { Progress, ProgressLabel } from "@workspace/ui/components/ui/progress"
import { cn } from "@workspace/ui/lib/utils"

import { resolveCourseImage } from "@/entities/course/model/course-visual-assets"

export function StartCourseCta() {
  return (
    <Link
      className={cn(
        cardVariants({ size: "lg", variant: "muted" }),
        "gap-6 px-8 outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
      )}
      href="/app/courses"
    >
      <div className="flex items-center gap-2">
        <SparklesIcon
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
        <span className="text-sm font-medium text-muted-foreground">
          지금 시작해볼까요?
        </span>
      </div>
      <h2 className="font-heading text-2xl leading-tight font-semibold tracking-[-0.025em]">
        새로운 코스를
        <br />
        선택해 보세요
      </h2>
      <div className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-xs">
        <span>코스 둘러보기</span>
        <ChevronRightIcon aria-hidden="true" className="size-4" />
      </div>
    </Link>
  )
}

export function ContinueCourseCard({
  course,
  priority = false,
}: {
  readonly course: LearnerProgressCourseDto
  readonly priority?: boolean
}) {
  const completedLessonCount = course.learning.completedLessons
  const totalLessonCount = course.learning.totalLessons
  const progressPercent = course.learning.progressPercent
  const nextLesson = course.learning.nextLesson
  const courseHref = `/app/courses/${course.id}`

  return (
    <Card className="w-full min-w-0 gap-0 py-0 select-none" size="sm">
      <Link
        className="flex w-full cursor-pointer flex-col text-left lg:flex-row"
        href={courseHref}
      >
        <div className="relative h-36 w-full shrink-0 overflow-hidden lg:h-28 lg:min-h-28 lg:w-44">
          <Image
            alt={resolveCourseImage(course).alt}
            className="object-cover pointer-events-none"
            draggable={false}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 176px, 100vw"
            src={resolveCourseImage(course).src}
          />
        </div>
        <CardContent className="pt-5 pb-4 lg:min-w-0 lg:flex-1 lg:py-4">
          <ContinueCourseSummary
            completedLessonCount={completedLessonCount}
            course={course}
            progressPercent={progressPercent}
            totalLessonCount={totalLessonCount}
          />
        </CardContent>
      </Link>
      <div className="flex flex-col gap-1 border-t border-border/60 px-3 py-3">
        {nextLesson !== null ? (
          <NextLessonLink lesson={nextLesson} />
        ) : (
          <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
            모든 레슨을 완료했어요
          </div>
        )}
      </div>
    </Card>
  )
}

function ContinueCourseSummary({
  completedLessonCount,
  course,
  progressPercent,
  totalLessonCount,
}: {
  readonly completedLessonCount: number
  readonly course: LearnerProgressCourseDto
  readonly progressPercent: number
  readonly totalLessonCount: number
}) {
  return (
    <>
      <p
        className="mb-3 font-heading text-base font-semibold tracking-[-0.014em]"
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
        className="gap-2"
        value={progressPercent}
      >
        <ProgressLabel className="sr-only">{course.title} 진행률</ProgressLabel>
        <span className="ml-auto text-xs font-medium text-muted-foreground tabular-nums">
          {completedLessonCount}/{totalLessonCount}
        </span>
      </Progress>
    </>
  )
}

function NextLessonLink({
  lesson,
}: {
  readonly lesson: NonNullable<
    LearnerProgressCourseDto["learning"]["nextLesson"]
  >
}) {
  return (
    <Link
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/25"
      href={`/app/lesson?lesson_id=${encodeURIComponent(lesson.id)}`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <PlayIcon aria-hidden="true" className="size-3.5" fill="currentColor" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-sm font-medium">
          {lesson.title}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {lesson.estimatedMinutes}분
        </span>
      </span>
    </Link>
  )
}
