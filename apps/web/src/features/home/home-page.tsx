"use client"

import Image from "next/image"
import Link from "next/link"

import { createCourseImageUrl } from "@/features/courses/course-visual-assets"
import type {
  ProgressCourse,
  ProgressCourseList,
  ProgressNextLesson,
} from "@/features/courses/course-types"
import {
  BookOpenIcon,
  ChevronRightIcon,
  FlameIcon,
  PlayIcon,
  SparklesIcon,
} from "@workspace/ui/components/icons"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import { Progress } from "@workspace/ui/components/ui/progress"
import { StatCard, StatGrid } from "@workspace/ui/components/ui/stat-card"
import { Surface } from "@workspace/ui/components/ui/surface"

const CONTINUE_COURSE_LIMIT = 5

type HomePageProps = {
  readonly learnerName: null | string | undefined
  readonly progress: ProgressCourseList
}

export function HomePage({ learnerName, progress }: HomePageProps) {
  const firstName = normalizeFirstName(learnerName)
  const totalDone = progress.courses.reduce(
    (total, course) =>
      total +
      course.lessons.filter((lesson) => lesson.status === "completed").length,
    0
  )
  const inProgress = progress.courses.filter(
    (course) =>
      course.progressPercent > 0 ||
      course.lessons.some((lesson) => lesson.status === "completed")
  )
  const hasProgress = inProgress.length > 0
  const items = inProgress.slice(0, CONTINUE_COURSE_LIMIT)

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-14">
      <div className="lg:w-[360px] lg:shrink-0 lg:sticky lg:top-20 lg:self-start">
        <div className="mb-8">
          <p className="mb-2 text-body-sm font-bold text-fg-muted">
            안녕하세요 👋
          </p>
          <h1 className="text-heading-lg font-black">
            {firstName}님,
            <br />
            오늘도 함께 써봐요.
          </h1>
        </div>
        <StatGrid aria-label="학습 현황" className="grid-cols-2 gap-3">
          <StatCard
            icon={<FlameIcon size={20} />}
            label="연속 학습"
            value={`${progress.currentStreakDays}일`}
          />
          <StatCard
            icon={<BookOpenIcon size={20} />}
            label="완료한 레슨"
            value={`${totalDone}개`}
          />
        </StatGrid>
      </div>

      <div className="flex-1 min-w-0">
        {hasProgress ? (
          <>
            <div className="flex items-baseline justify-between mb-5">
              <p className="text-label-sm font-bold uppercase text-fg-muted">
                이어서 학습하기
              </p>
              <p className="text-label-sm font-bold text-fg-muted">
                {items.length}개 코스
              </p>
            </div>
            <div
              className="lg:hidden flex overflow-x-auto gap-5 no-scrollbar -mx-4 px-4 pt-1 pb-3"
              style={{
                scrollPaddingLeft: "1rem",
                scrollSnapType: "x mandatory",
              }}
            >
              {items.map((course, index) => (
                <div
                  className="last:pr-2"
                  key={course.id}
                  style={{ scrollSnapAlign: "start" }}
                >
                  <ContinueCourseCard
                    course={course}
                    priority={index === 0}
                    variant="mobile"
                  />
                </div>
              ))}
            </div>
            <div className="hidden lg:flex flex-col gap-4">
              {items.map((course, index) => (
                <ContinueCourseCard
                  course={course}
                  key={course.id}
                  priority={index === 0}
                  variant="desktop"
                />
              ))}
            </div>
          </>
        ) : (
          <Link
            className="block cursor-pointer rounded-panel bg-bg-surface p-7 btn-squish"
            href="/app/courses"
          >
            <div className="flex items-center gap-2 mb-5">
              <SparklesIcon className="text-fg-muted" size={16} />
              <span className="text-label-md font-bold text-fg-muted">
                지금 시작해볼까요?
              </span>
            </div>
            <h2 className="mb-7 text-heading-sm font-black">
              첫 번째 코스를
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
        )}
      </div>
    </div>
  )
}

type ContinueCourseCardProps = {
  readonly course: ProgressCourse
  readonly priority?: boolean
  readonly variant: "desktop" | "mobile"
}

function ContinueCourseCard({
  course,
  priority = false,
  variant,
}: ContinueCourseCardProps) {
  const completedLessonCount = course.lessons.filter(
    (lesson) => lesson.status === "completed"
  ).length
  const totalLessonCount = course.lessons.length
  const progressPercent = clampProgressPercent(course.progressPercent)
  const nextLessons = course.nextLessons.slice(0, 2)
  const isDesktop = variant === "desktop"
  const courseHref = `/app/courses/${course.id}`

  return (
    <Surface
      variant="panel"
      size="none"
      className={
        isDesktop
          ? "overflow-hidden select-none"
          : "flex w-80 shrink-0 flex-col overflow-hidden select-none sm:w-[22rem]"
      }
    >
      {isDesktop ? (
        <div className="flex">
          <Link
            className="relative min-h-28 w-44 shrink-0 cursor-pointer btn-squish"
            href={courseHref}
          >
            <Image
              alt={course.title}
              className="object-cover pointer-events-none"
              draggable={false}
              fill
              priority={priority}
              sizes="176px"
              src={createCourseImageUrl(course.visualKey)}
            />
          </Link>
          <Link
            className="flex-1 min-w-0 px-5 py-4 cursor-pointer btn-squish text-left"
            href={courseHref}
          >
            <ContinueCourseSummary
              completedLessonCount={completedLessonCount}
              course={course}
              progressPercent={progressPercent}
              totalLessonCount={totalLessonCount}
              variant={variant}
            />
          </Link>
        </div>
      ) : (
        <Link
          className="w-full cursor-pointer btn-squish text-left"
          href={courseHref}
        >
          <div className="relative h-36 w-full">
            <Image
              alt={course.title}
              className="object-cover pointer-events-none"
              draggable={false}
              fill
              priority={priority}
              sizes="(min-width: 640px) 22rem, 20rem"
              src={createCourseImageUrl(course.visualKey)}
            />
          </div>
          <div className="px-6 pt-5 pb-4">
            <ContinueCourseSummary
              completedLessonCount={completedLessonCount}
              course={course}
              progressPercent={progressPercent}
              totalLessonCount={totalLessonCount}
              variant={variant}
            />
          </div>
        </Link>
      )}
      <div
        className={
          isDesktop
            ? "px-3 pb-3 flex flex-col gap-0.5"
            : "px-3 pb-4 flex flex-col gap-1"
        }
      >
        {nextLessons.length > 0 ? (
          nextLessons.map((lesson) => (
            <NextLessonLink
              isDesktop={isDesktop}
              key={lesson.id}
              lesson={lesson}
            />
          ))
        ) : (
          <div className="px-4 py-3 text-label-md font-bold text-fg-muted">
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
  variant,
}: {
  readonly completedLessonCount: number
  readonly course: ProgressCourse
  readonly progressPercent: number
  readonly totalLessonCount: number
  readonly variant: "desktop" | "mobile"
}) {
  return (
    <>
      <p
        className={
          variant === "desktop"
            ? "mb-3 text-body-md font-bold"
            : "mb-3 text-title-md font-bold"
        }
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
        value={progressPercent}
      >
        <span className="shrink-0 text-label-sm font-bold text-fg-muted">
          {completedLessonCount}/{totalLessonCount}
        </span>
      </Progress>
    </>
  )
}

function NextLessonLink({
  isDesktop,
  lesson,
}: {
  readonly isDesktop: boolean
  readonly lesson: ProgressNextLesson
}) {
  return (
    <Link
      className={
        isDesktop
          ? "flex items-center gap-3 rounded-2xl px-3 py-3 text-left btn-squish hover:bg-bg-surface-hover"
          : "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-left btn-squish hover:bg-bg-surface-hover"
      }
      href={`/app/lesson?lesson_id=${encodeURIComponent(lesson.id)}`}
    >
      <span
        className={
          isDesktop
            ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-action-primary-bg text-action-primary-fg"
            : "flex size-10 shrink-0 items-center justify-center rounded-full bg-action-primary-bg text-action-primary-fg"
        }
      >
        <PlayIcon fill="currentColor" size={isDesktop ? 12 : 14} />
      </span>
      <span className="flex-1 min-w-0">
        <span
          className={
            isDesktop
              ? "block truncate text-body-sm font-bold"
              : "block truncate text-body-md font-bold"
          }
        >
          {lesson.title}
        </span>
        <span
          className={
            isDesktop
              ? "mt-0.5 block text-label-sm font-bold text-fg-muted"
              : "mt-1 block text-label-sm font-bold text-fg-muted"
          }
        >
          {lesson.estimatedMinutes}분
        </span>
      </span>
    </Link>
  )
}

function clampProgressPercent(percent: number): number {
  return Math.min(Math.max(percent, 0), 100)
}

function normalizeFirstName(name: null | string | undefined): string {
  const trimmed = name?.trim()

  if (trimmed === undefined || trimmed.length === 0 || trimmed === "학습자") {
    return "글쓰기"
  }

  return trimmed.split(/\s+/)[0] ?? "글쓰기"
}
