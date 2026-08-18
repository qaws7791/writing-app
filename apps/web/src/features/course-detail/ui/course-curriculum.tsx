"use client"

import Link from "next/link"

import type {
  LearnerCourseDetailDto,
  LearnerCourseLessonDto,
  LearnerCourseUnitDto,
} from "@/shared/http/learner-api-client"
import { PlayIcon } from "@workspace/ui/components/icons/action-icons"
import { CheckIcon } from "@workspace/ui/components/icons/control-icons"
import { LockIcon } from "@workspace/ui/components/icons/learning-icons"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/primitives/accordion"
import { cn } from "@workspace/ui/lib/utils"

type CourseCurriculumProps = {
  readonly course: LearnerCourseDetailDto
  readonly currentLessonId: string | null
}

type CourseUnit = LearnerCourseUnitDto
type CourseLessonSummary = LearnerCourseLessonDto

export function CourseCurriculum({
  course,
  currentLessonId,
}: CourseCurriculumProps) {
  return (
    <section aria-labelledby="course-curriculum-title">
      <h2
        className="mb-5 font-heading text-2xl font-semibold tracking-[-0.01em]"
        id="course-curriculum-title"
      >
        커리큘럼
      </h2>
      <Accordion
        defaultValue={course.units[0] ? [course.units[0].id] : []}
        multiple
      >
        {course.units.map((unit) => (
          <CurriculumUnit
            currentLessonId={currentLessonId}
            key={unit.id}
            unit={unit}
          />
        ))}
      </Accordion>
    </section>
  )
}

function CurriculumUnit({
  currentLessonId,
  unit,
}: {
  readonly currentLessonId: string | null
  readonly unit: CourseUnit
}) {
  const completedCount = unit.lessons.filter(
    (lesson) => lesson.learning.status === "completed"
  ).length
  const totalCount = unit.lessons.length
  const unitDone = completedCount === totalCount && totalCount > 0

  return (
    <AccordionItem className="min-w-0" value={unit.id}>
      <AccordionTrigger className="min-w-0 items-center px-0 py-5 **:data-[slot=accordion-trigger-icon]:mt-0">
        <div className="flex min-w-0 flex-col pr-2">
          <span className="block truncate font-heading text-base font-semibold tracking-[-0.01em] wrap-anywhere [word-break:keep-all]">
            {unit.title}
          </span>
          <span
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              unitDone
                ? "font-medium text-success"
                : "font-normal text-muted-foreground"
            )}
          >
            {unitDone ? (
              <CheckIcon aria-hidden="true" className="size-3.5 shrink-0" />
            ) : null}
            <span>
              {unitDone
                ? `${completedCount}/${totalCount}개 레슨 완료`
                : `${completedCount}/${totalCount}개 레슨`}
            </span>
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-0 pb-3 [&_a]:no-underline [&_a]:hover:no-underline">
        <div className="grid min-w-0 gap-1">
          {unit.lessons.map((lesson) => (
            <CurriculumLesson
              isCurrent={currentLessonId === lesson.id}
              key={lesson.id}
              lesson={lesson}
              status={lesson.learning.status}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

function CurriculumLesson({
  isCurrent,
  lesson,
  status,
}: {
  readonly isCurrent: boolean
  readonly lesson: CourseLessonSummary
  readonly status: CourseLessonSummary["learning"]["status"]
}) {
  const done = status === "completed"
  const locked = status === "locked"
  const statusLabel = locked
    ? "잠김"
    : done
      ? "완료"
      : isCurrent
        ? "다음"
        : "학습 가능"
  const accessibleName = `${lesson.title}, ${statusLabel}, ${lesson.estimatedMinutes}분`

  const className = cn(
    "relative flex min-h-14 min-w-0 items-center gap-3 rounded-2xl px-3 py-3 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/25",
    locked
      ? "cursor-not-allowed opacity-60"
      : isCurrent
        ? "bg-accent/70 hover:bg-accent"
        : "hover:bg-muted/55"
  )
  const content = (
    <>
      {isCurrent ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-2 left-1 w-1 rounded-full bg-foreground"
        />
      ) : null}
      <span
        aria-hidden="true"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          done
            ? "bg-success/10 text-success"
            : locked
              ? "bg-secondary text-muted-foreground"
              : isCurrent
                ? "bg-background text-foreground ring-1 ring-border ring-inset"
                : "bg-secondary text-secondary-foreground"
        )}
      >
        {done ? (
          <CheckIcon className="size-3.5" />
        ) : locked ? (
          <LockIcon className="size-3.5" />
        ) : (
          <PlayIcon className="size-3" fill="currentColor" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm font-medium",
            locked ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {lesson.title}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {lesson.estimatedMinutes}분
        </span>
      </span>
    </>
  )

  if (locked) {
    return (
      <div aria-label={accessibleName} className={className}>
        {content}
      </div>
    )
  }

  return (
    <Link
      aria-label={accessibleName}
      className={className}
      href={`/app/lesson?lesson_id=${encodeURIComponent(lesson.id)}`}
    >
      {content}
    </Link>
  )
}
