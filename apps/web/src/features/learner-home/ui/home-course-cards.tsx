import Link from "next/link"

import type { LearnerProgressCourseDto } from "@/shared/http/learner-api-client"
import {
  ChevronRightIcon,
  PlayIcon,
  SparklesIcon,
} from "@workspace/ui/components/icons/action-icons"
import { cardVariants } from "@workspace/ui/components/primitives/card"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/primitives/progress"
import { cn } from "@workspace/ui/lib/utils"

import { HomeCourseMark } from "@/features/learner-home/ui/home-course-mark"

export function StartCourseCta() {
  return (
    <Link
      className={cn(
        cardVariants({ size: "lg", variant: "muted" }),
        "gap-6 rounded-[1.75rem] px-8 outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
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
}: {
  readonly course: LearnerProgressCourseDto
}) {
  const completedLessonCount = course.learning.completedLessons
  const totalLessonCount = course.learning.totalLessons
  const progressPercent = course.learning.progressPercent
  const nextLesson = course.learning.nextLesson
  const courseHref = `/app/courses/${course.id}`

  return (
    <article
      className={cn(
        cardVariants({ size: "sm", variant: "surface" }),
        "gap-5 rounded-[1.75rem]"
      )}
    >
      <Link
        className="flex items-start gap-4 px-(--card-spacing) outline-none focus-visible:ring-3 focus-visible:ring-ring/25 sm:gap-5"
        href={courseHref}
      >
        <HomeCourseMark label={course.title} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="font-heading text-base font-semibold tracking-[-0.025em] text-balance sm:text-lg">
            {course.title}
          </h3>
          <Progress className="mt-3 gap-1.5" value={progressPercent}>
            <ProgressLabel className="sr-only">
              {course.title} 진행
            </ProgressLabel>
            <ProgressValue className="text-xs tabular-nums text-muted-foreground">
              {() => `${completedLessonCount}/${totalLessonCount}레슨`}
            </ProgressValue>
          </Progress>
        </div>
      </Link>

      <div className="px-(--card-spacing)">
        {nextLesson !== null ? (
          <NextLessonLink lesson={nextLesson} />
        ) : (
          <p className="px-3.5 py-3 text-sm text-muted-foreground">
            모든 레슨을 완료했어요
          </p>
        )}
      </div>
    </article>
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
      aria-label={`${lesson.title} 시작, ${lesson.estimatedMinutes}분`}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-3xl px-3.5 py-3 text-left outline-none transition-[background-color,transform] duration-125 ease-press",
        "hover:bg-accent active:scale-[0.995]",
        "focus-visible:ring-3 focus-visible:ring-ring/25"
      )}
      href={`/app/lesson?lesson_id=${encodeURIComponent(lesson.id)}`}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background">
        <PlayIcon
          aria-hidden="true"
          className="size-4 translate-x-px"
          fill="currentColor"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium tracking-[-0.01em] text-pretty">
          {lesson.title}
        </span>
        <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
          {lesson.estimatedMinutes}분
        </span>
      </span>
    </Link>
  )
}
