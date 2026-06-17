"use client"

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation"
import type { ReactNode } from "react"

import { createCourseImageUrl } from "@/features/courses/course-visual-assets"
import type {
  ProgressCourse,
  ProgressCourseList,
  ProgressNextLesson,
} from "@/features/courses/course-types"
import { PlayIcon } from "@workspace/ui/components/icons"

const CONTINUE_COURSE_LIMIT = 5

type HomePageProps = {
  readonly learnerName: null | string | undefined
  readonly progress: ProgressCourseList
}

export function HomePage({ learnerName, progress }: HomePageProps) {
  const router = useRouter()
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
          <p
            className="text-muted font-bold mb-2"
            style={{ fontSize: "0.9375rem" }}
          >
            안녕하세요 👋
          </p>
          <h1
            className="font-black"
            style={{ fontSize: "2.25rem", lineHeight: 1.2 }}
          >
            {firstName}님,
            <br />
            오늘도 함께 써봐요.
          </h1>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-3 bg-surface rounded-2xl px-5 py-3.5 flex-1">
            <KwepFlameIcon className="shrink-0 text-muted" size={20} />
            <div>
              <p
                className="font-black"
                style={{ fontSize: "1.25rem", lineHeight: 1 }}
              >
                {progress.currentStreakDays}일
              </p>
              <p
                className="font-bold text-muted"
                style={{ fontSize: "0.6875rem", marginTop: 6 }}
              >
                연속 학습
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-surface rounded-2xl px-5 py-3.5 flex-1">
            <KwepBookOpenIcon className="shrink-0 text-muted" size={20} />
            <div>
              <p
                className="font-black"
                style={{ fontSize: "1.25rem", lineHeight: 1 }}
              >
                {totalDone}개
              </p>
              <p
                className="font-bold text-muted"
                style={{ fontSize: "0.6875rem", marginTop: 6 }}
              >
                완료한 레슨
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {hasProgress ? (
          <>
            <div className="flex items-baseline justify-between mb-5">
              <p
                className="font-bold text-muted"
                style={{
                  fontSize: "0.75rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                이어서 학습하기
              </p>
              <p
                className="font-bold text-muted"
                style={{ fontSize: "0.75rem" }}
              >
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
              {items.map((course) => (
                <div
                  className="last:pr-2"
                  key={course.id}
                  style={{ scrollSnapAlign: "start" }}
                >
                  <ContinueCourseCard course={course} variant="mobile" />
                </div>
              ))}
            </div>
            <div className="hidden lg:flex flex-col gap-4">
              {items.map((course) => (
                <ContinueCourseCard
                  course={course}
                  key={course.id}
                  variant="desktop"
                />
              ))}
            </div>
          </>
        ) : (
          <div
            className="bg-surface rounded-4xl p-7 cursor-pointer btn-squish"
            onClick={() => router.push("/app/courses")}
          >
            <div className="flex items-center gap-2 mb-5">
              <KwepSparklesIcon className="text-muted" size={16} />
              <span
                className="text-muted font-bold"
                style={{ fontSize: "0.875rem" }}
              >
                지금 시작해볼까요?
              </span>
            </div>
            <h2
              className="font-black mb-7"
              style={{ fontSize: "1.625rem", lineHeight: 1.3 }}
            >
              첫 번째 코스를
              <br />
              선택해 보세요
            </h2>
            <div className="flex items-center justify-between bg-charcoal text-cream px-6 py-4 rounded-full">
              <span className="font-bold" style={{ fontSize: "1rem" }}>
                코스 둘러보기
              </span>
              <KwepChevronRightIcon size={20} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type ContinueCourseCardProps = {
  readonly course: ProgressCourse
  readonly variant: "desktop" | "mobile"
}

function ContinueCourseCard({ course, variant }: ContinueCourseCardProps) {
  const router = useRouter()
  const completedLessonCount = course.lessons.filter(
    (lesson) => lesson.status === "completed"
  ).length
  const totalLessonCount = course.lessons.length
  const progressPercent = clampProgressPercent(course.progressPercent)
  const nextLessons = course.nextLessons.slice(0, 2)
  const isDesktop = variant === "desktop"

  return (
    <div
      className={
        isDesktop
          ? "bg-surface rounded-[24px] overflow-hidden select-none"
          : "w-80 sm:w-[22rem] shrink-0 bg-surface rounded-[28px] overflow-hidden flex flex-col select-none"
      }
    >
      {isDesktop ? (
        <div className="flex">
          <button
            className="w-44 shrink-0 cursor-pointer btn-squish"
            onClick={() => router.push(`/app/courses/${course.id}`)}
            type="button"
          >
            <img
              alt={course.title}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
              src={createCourseImageUrl(course.visualKey)}
              style={{ minHeight: "7rem" }}
            />
          </button>
          <button
            className="flex-1 min-w-0 px-5 py-4 cursor-pointer btn-squish text-left"
            onClick={() => router.push(`/app/courses/${course.id}`)}
            type="button"
          >
            <ContinueCourseSummary
              completedLessonCount={completedLessonCount}
              course={course}
              progressPercent={progressPercent}
              totalLessonCount={totalLessonCount}
              titleFontSize="1rem"
            />
          </button>
        </div>
      ) : (
        <button
          className="w-full cursor-pointer btn-squish text-left"
          onClick={() => router.push(`/app/courses/${course.id}`)}
          type="button"
        >
          <img
            alt={course.title}
            className="w-full h-36 object-cover pointer-events-none"
            draggable={false}
            src={createCourseImageUrl(course.visualKey)}
          />
          <div className="px-6 pt-5 pb-4">
            <ContinueCourseSummary
              completedLessonCount={completedLessonCount}
              course={course}
              progressPercent={progressPercent}
              totalLessonCount={totalLessonCount}
              titleFontSize="1.0625rem"
            />
          </div>
        </button>
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
            <NextLessonButton
              isDesktop={isDesktop}
              key={lesson.id}
              lesson={lesson}
            />
          ))
        ) : (
          <div
            className="px-4 py-3 text-muted font-bold"
            style={{ fontSize: "0.875rem" }}
          >
            모든 레슨을 완료했어요
          </div>
        )}
      </div>
    </div>
  )
}

function ContinueCourseSummary({
  completedLessonCount,
  course,
  progressPercent,
  titleFontSize,
  totalLessonCount,
}: {
  readonly completedLessonCount: number
  readonly course: ProgressCourse
  readonly progressPercent: number
  readonly titleFontSize: string
  readonly totalLessonCount: number
}) {
  return (
    <>
      <p
        className="font-bold mb-3"
        style={{
          display: "-webkit-box",
          fontSize: titleFontSize,
          lineHeight: 1.45,
          overflow: "hidden",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
        }}
      >
        {course.title}
      </p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-charcoal/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-charcoal rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span
          className="font-bold text-muted shrink-0"
          style={{ fontSize: "0.75rem" }}
        >
          {completedLessonCount}/{totalLessonCount}
        </span>
      </div>
    </>
  )
}

function NextLessonButton({
  isDesktop,
  lesson,
}: {
  readonly isDesktop: boolean
  readonly lesson: ProgressNextLesson
}) {
  const router = useRouter()

  return (
    <button
      className={
        isDesktop
          ? "text-left flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-charcoal/5 btn-squish"
          : "text-left flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-charcoal/5 btn-squish"
      }
      onClick={() => router.push(`/app/lesson?lesson_id=${lesson.id}`)}
      type="button"
    >
      <span
        className={
          isDesktop
            ? "w-8 h-8 shrink-0 rounded-full bg-charcoal text-cream flex items-center justify-center"
            : "w-10 h-10 shrink-0 rounded-full bg-charcoal text-cream flex items-center justify-center"
        }
      >
        <PlayIcon fill="currentColor" size={isDesktop ? 12 : 14} />
      </span>
      <span className="flex-1 min-w-0">
        <span
          className="block font-bold truncate"
          style={{
            fontSize: isDesktop ? "0.875rem" : "0.9375rem",
            lineHeight: 1.4,
          }}
        >
          {lesson.title}
        </span>
        <span
          className="block text-muted font-bold"
          style={{ fontSize: "0.75rem", marginTop: isDesktop ? 2 : 3 }}
        >
          {lesson.estimatedMinutes}분
        </span>
      </span>
    </button>
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

type KwepIconProps = {
  readonly className?: string
  readonly size?: number
}

function KwepFlameIcon({ className, size = 24 }: KwepIconProps) {
  return (
    <KwepSvgIcon className={className} name="flame" size={size}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </KwepSvgIcon>
  )
}

function KwepBookOpenIcon({ className, size = 24 }: KwepIconProps) {
  return (
    <KwepSvgIcon className={className} name="book-open" size={size}>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </KwepSvgIcon>
  )
}

function KwepSparklesIcon({ className, size = 24 }: KwepIconProps) {
  return (
    <KwepSvgIcon className={className} name="sparkles" size={size}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </KwepSvgIcon>
  )
}

function KwepChevronRightIcon({ className, size = 24 }: KwepIconProps) {
  return (
    <KwepSvgIcon className={className} name="chevron-right" size={size}>
      <path d="m9 18 6-6-6-6" />
    </KwepSvgIcon>
  )
}

function KwepSvgIcon({
  children,
  className,
  name,
  size,
}: KwepIconProps & {
  readonly children: ReactNode
  readonly name: string
}) {
  const mergedClassName = `lucide lucide-${name}${className ? ` ${className}` : ""}`

  return (
    <svg
      className={mergedClassName}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  )
}
