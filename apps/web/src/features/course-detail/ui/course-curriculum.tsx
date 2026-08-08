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
} from "@workspace/ui/components/ui/accordion"
import { Badge } from "@workspace/ui/components/ui/badge"
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
        className="mb-5 font-heading text-2xl font-semibold tracking-[-0.025em]"
        id="course-curriculum-title"
      >
        커리큘럼
      </h2>
      <Accordion
        className="gap-3"
        defaultValue={course.units[0] ? [course.units[0].id] : []}
        multiple
      >
        {course.units.map((unit, unitIndex) => (
          <CurriculumUnit
            currentLessonId={currentLessonId}
            key={unit.id}
            unit={unit}
            unitIndex={unitIndex}
          />
        ))}
      </Accordion>
    </section>
  )
}

function CurriculumUnit({
  currentLessonId,
  unit,
  unitIndex,
}: {
  readonly currentLessonId: string | null
  readonly unit: CourseUnit
  readonly unitIndex: number
}) {
  const completedCount = unit.lessons.filter(
    (lesson) => lesson.learning.status === "completed"
  ).length
  const totalCount = unit.lessons.length
  const unitDone = completedCount === totalCount && totalCount > 0

  return (
    <AccordionItem
      className="min-w-0 rounded-3xl border-0 bg-muted/55 px-4"
      value={unit.id}
    >
      <AccordionTrigger className="min-w-0 py-5">
        <div className="flex min-w-0 items-center gap-3 pr-2">
          <span
            aria-hidden="true"
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-2xl font-heading font-semibold",
              unitDone
                ? "bg-primary text-primary-foreground"
                : "bg-background/80 text-foreground"
            )}
          >
            {unitDone ? (
              <CheckIcon className="size-4" />
            ) : (
              <span>{unitIndex + 1}</span>
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-heading text-base font-semibold tracking-[-0.014em]">
              {unit.title}
            </span>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              {completedCount}/{totalCount}개 레슨
            </span>
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-3">
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
    "flex min-h-14 min-w-0 items-center gap-3 rounded-2xl px-3 py-3 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/25",
    locked
      ? "cursor-not-allowed opacity-60"
      : isCurrent
        ? "bg-background hover:bg-background"
        : "hover:bg-background/65"
  )
  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-xl",
          done
            ? "bg-success/10 text-success"
            : locked
              ? "bg-background text-muted-foreground"
              : isCurrent
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground"
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
      <Badge
        variant={
          done
            ? "success"
            : locked
              ? "outline"
              : isCurrent
                ? "default"
                : "secondary"
        }
      >
        {statusLabel}
      </Badge>
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
