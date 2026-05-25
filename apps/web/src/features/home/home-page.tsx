import Image from "next/image"
import Link from "next/link"

import { ProgressBar } from "@workspace/ui/components/ui/progress-bar"
import { Separator } from "@workspace/ui/components/ui/separator"
import {
  CheckIcon,
  ChevronRightIcon,
  LockIcon,
  PlayIcon,
} from "@workspace/ui/components/icons"
import { cn } from "@workspace/ui/lib/utils"

import {
  inProgressCourses,
  type HomeLesson,
  type InProgressCourse,
  type LessonStatus,
} from "@/features/home/home-data"

export function HomePage() {
  return (
    <div className="w-full bg-background text-foreground">
      <div className="mx-auto flex max-w-[778px] flex-col px-4 pt-6 pb-10 sm:pt-8">
        <header className="mb-6 flex items-baseline justify-between gap-4 sm:mb-8">
          <h1 className="m-0 text-2xl font-bold tracking-normal">
            진행 중인 코스
          </h1>
          <p className="m-0 shrink-0 text-sm font-medium text-muted-foreground">
            총 {inProgressCourses.length}개 진행 중
          </p>
        </header>

        <main className="flex flex-col">
          {inProgressCourses.map((course, index) => (
            <CourseProgressItem
              key={course.id}
              course={course}
              isLast={index === inProgressCourses.length - 1}
            />
          ))}
        </main>
      </div>
    </div>
  )
}

function CourseProgressItem({
  course,
  isLast,
}: {
  course: InProgressCourse
  isLast: boolean
}) {
  return (
    <article className="flex flex-col">
      <Link
        href={`/courses/${course.id}`}
        className="group -mx-3 mb-2 flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-muted/70 active:bg-muted"
        aria-label={`${course.title} 코스 상세로 이동`}
      >
        <Image
          src={course.thumbnail}
          alt={`${course.title} 썸네일`}
          width={80}
          height={80}
          sizes="80px"
          className="size-20 shrink-0 rounded-2xl object-cover"
          priority={course.progressPercent > 40}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="m-0 truncate text-lg font-bold tracking-normal">
            {course.title}
          </h2>
          <p className="m-0 truncate text-[15px] text-muted-foreground">
            {course.description}
          </p>
          <div className="flex w-full items-center gap-3">
            <ProgressBar
              value={course.progressPercent}
              aria-label={`${course.title} 진행률`}
              className="flex-1 gap-0 [&_[data-slot=progress-indicator]]:bg-primary [&_[data-slot=progress-track]]:h-1.5"
            />
            <span className="shrink-0 text-[13px] font-medium text-muted-foreground">
              {Math.round(course.progressPercent)}% 완료
            </span>
          </div>
        </div>

        <ChevronRightIcon
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden="true"
        />
      </Link>

      <div className="mt-1 flex flex-col gap-1">
        {course.lessons.map((lesson) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            courseTitle={course.title}
          />
        ))}
      </div>

      {isLast ? null : <Separator className="my-6" />}
    </article>
  )
}

function LessonRow({
  lesson,
  courseTitle,
}: {
  lesson: HomeLesson
  courseTitle: string
}) {
  const statusLabel = getLessonStatusLabel(lesson.status)

  return (
    <Link
      href={`/lesson?lesson_id=${lesson.id}`}
      className={cn(
        "-mx-3 flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-muted/60 active:bg-muted",
        lesson.status === "next-up"
          ? "font-semibold text-foreground"
          : "font-medium text-muted-foreground hover:text-foreground",
        lesson.status === "locked" && "text-muted-foreground/80"
      )}
      aria-label={`${courseTitle}: ${lesson.name} ${statusLabel}`}
    >
      <LessonStatusIcon status={lesson.status} />
      <span className="flex-1 truncate">{lesson.name}</span>
    </Link>
  )
}

function LessonStatusIcon({ status }: { status: LessonStatus }) {
  if (status === "completed") {
    return <CheckIcon className="size-3.5 shrink-0" aria-hidden="true" />
  }

  if (status === "locked") {
    return <LockIcon className="size-3.5 shrink-0" aria-hidden="true" />
  }

  return (
    <PlayIcon className="size-3.5 shrink-0 fill-current" aria-hidden="true" />
  )
}

function getLessonStatusLabel(status: LessonStatus) {
  if (status === "completed") {
    return "복습"
  }

  if (status === "locked") {
    return "잠김"
  }

  return "시작"
}
