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

import { HomeCourseImage } from "@/features/learner-home/ui/home-course-image"

type ContinueLesson = NonNullable<
  Extract<
    LearnerProgressCourseDto["learning"],
    { status: "in_progress" | "not_started" }
  >["nextLesson"]
>

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
  variant = "default",
}: {
  readonly course: LearnerProgressCourseDto
  readonly variant?: "default" | "hero"
}) {
  const completedLessonCount = course.learning.completedLessons
  const totalLessonCount = course.learning.totalLessons
  const progressPercent = course.learning.progressPercent
  const continueLessons = readContinueLessons(course.learning)
  const primaryLesson = continueLessons[0]
  const followingLesson = continueLessons[1]
  const courseHref = `/app/courses/${course.id}`
  const hideCourseLinkOnNarrow = followingLesson !== undefined

  return (
    <article
      className={cn(
        cardVariants({ size: "sm", variant: "surface" }),
        "gap-5 rounded-[1.75rem]",
        variant === "hero" && "gap-6"
      )}
    >
      <div className="flex items-start gap-4 px-(--card-spacing) sm:gap-5">
        <HomeCourseImage course={course} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3
            className={cn(
              "font-heading font-semibold tracking-[-0.025em] text-balance",
              variant === "hero" ? "text-lg sm:text-xl" : "text-base sm:text-lg"
            )}
          >
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
          <Link
            className={cn(
              "mt-2 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25",
              hideCourseLinkOnNarrow
                ? "hidden @[48rem]:inline-flex"
                : "inline-flex"
            )}
            href={courseHref}
          >
            코스 보기
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-(--card-spacing)">
        {primaryLesson === undefined ? (
          <p className="px-1 py-3 text-sm text-muted-foreground">
            모든 레슨을 완료했어요
          </p>
        ) : (
          <PrimaryLessonLink
            emphasized={variant === "hero"}
            lesson={primaryLesson}
          />
        )}
        {followingLesson === undefined ? null : (
          <FollowingLessonLink lesson={followingLesson} />
        )}
      </div>
    </article>
  )
}

function readContinueLessons(
  learning: LearnerProgressCourseDto["learning"]
): readonly ContinueLesson[] {
  if (learning.status === "completed") {
    return []
  }

  return learning.followingLesson === null
    ? [learning.nextLesson]
    : [learning.nextLesson, learning.followingLesson]
}

function PrimaryLessonLink({
  emphasized,
  lesson,
}: {
  readonly emphasized: boolean
  readonly lesson: ContinueLesson
}) {
  return (
    <Link
      aria-label={`${lesson.title} 시작, ${lesson.estimatedMinutes}분`}
      className={cn(
        "flex w-full items-center gap-3.5 text-left outline-none transition-[background-color,transform] duration-125 ease-press",
        "focus-visible:ring-3 focus-visible:ring-ring/25 active:scale-[0.995]",
        emphasized
          ? "min-h-12 rounded-2xl bg-primary px-5 text-primary-foreground"
          : "rounded-2xl px-1 py-2 hover:text-foreground"
      )}
      href={`/app/lesson?lesson_id=${encodeURIComponent(lesson.id)}`}
    >
      {emphasized ? null : (
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background">
          <PlayIcon
            aria-hidden="true"
            className="size-4 translate-x-px"
            fill="currentColor"
          />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium tracking-[-0.01em] text-pretty">
          {lesson.title}
        </span>
        <span
          className={cn(
            "mt-0.5 block text-xs tabular-nums",
            emphasized ? "text-primary-foreground/80" : "text-muted-foreground"
          )}
        >
          {lesson.estimatedMinutes}분
        </span>
      </span>
    </Link>
  )
}

function FollowingLessonLink({ lesson }: { readonly lesson: ContinueLesson }) {
  return (
    <Link
      className="px-1 py-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25"
      href={`/app/lesson?lesson_id=${encodeURIComponent(lesson.id)}`}
    >
      다음 · {lesson.title} · {lesson.estimatedMinutes}분
    </Link>
  )
}
