import Link from "next/link"

import type {
  CourseDetail,
  CourseLessonSummary,
  CourseUnit,
  LessonProgressStatus,
  ProgressCourse,
} from "@/features/courses/course-types"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import { ArrowRightIcon, CheckCircleIcon } from "@workspace/ui/components/icons"

type CourseCurriculumProps = {
  readonly course: CourseDetail
  readonly progressCourse?: ProgressCourse
}

const statusLabel = {
  available: "진행 가능",
  completed: "완료",
  locked: "잠김",
} as const satisfies Record<LessonProgressStatus, string>

export function CourseCurriculum({
  course,
  progressCourse,
}: CourseCurriculumProps) {
  return (
    <section aria-labelledby="course-curriculum-heading">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-2xl font-semibold" id="course-curriculum-heading">
          커리큘럼
        </h2>
        <p className="text-sm text-muted-foreground">
          유닛별 레슨 상태를 확인하고 진행 가능한 레슨으로 이동하세요.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {course.units.map((unit, unitIndex) => (
          <CurriculumUnit
            key={unit.id}
            initiallyOpen={unitIndex === 0}
            progressCourse={progressCourse}
            unit={unit}
          />
        ))}
      </div>
    </section>
  )
}

function CurriculumUnit({
  initiallyOpen,
  progressCourse,
  unit,
}: {
  readonly initiallyOpen: boolean
  readonly progressCourse?: ProgressCourse
  readonly unit: CourseUnit
}) {
  return (
    <details
      aria-labelledby={`course-unit-${unit.id}`}
      className="rounded-lg border border-border bg-card p-4 text-card-foreground"
      open={initiallyOpen}
      role="group"
    >
      <summary
        aria-label={unit.title}
        className="flex cursor-pointer list-none items-center justify-between gap-4"
        role="button"
      >
        <h3 className="text-lg font-semibold" id={`course-unit-${unit.id}`}>
          {unit.title}
        </h3>
        <span className="text-sm text-muted-foreground">
          {unit.lessons.length}개 레슨
        </span>
      </summary>
      <ol className="mt-4 flex flex-col gap-3">
        {unit.lessons.map((lesson) => (
          <CurriculumLesson
            key={lesson.id}
            lesson={lesson}
            status={resolveLessonStatus(progressCourse, lesson.id)}
          />
        ))}
      </ol>
    </details>
  )
}

function CurriculumLesson({
  lesson,
  status,
}: {
  readonly lesson: CourseLessonSummary
  readonly status: LessonProgressStatus
}) {
  const isAvailable = status === "available"

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{lesson.title}</span>
          <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            {statusLabel[status]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {lesson.estimatedMinutes}분
          {lesson.category === null ? "" : ` · ${lesson.category}`}
        </p>
      </div>
      {isAvailable ? (
        <Link
          className={buttonVariants({ size: "sm" })}
          href={`/app/lesson?lesson_id=${lesson.id}`}
        >
          {lesson.title} 시작
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      ) : status === "completed" ? (
        <span
          aria-label="완료됨"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <CheckCircleIcon />
        </span>
      ) : (
        <span aria-hidden="true" className="hidden md:block" />
      )}
    </li>
  )
}

function resolveLessonStatus(
  progressCourse: ProgressCourse | undefined,
  lessonId: string
): LessonProgressStatus {
  return (
    progressCourse?.lessons.find((lesson) => lesson.id === lessonId)?.status ??
    "locked"
  )
}
