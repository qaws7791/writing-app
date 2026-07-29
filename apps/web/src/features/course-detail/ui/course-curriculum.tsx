"use client"

import Link from "next/link"

import type {
  LearnerCourseDetailDto,
  LearnerCourseLessonDto,
  LearnerCourseUnitDto,
} from "@/shared/http/learner-api-client"
import { CheckIcon, LockIcon, PlayIcon } from "@workspace/ui/components/icons"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/ui/accordion"
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
        className="mb-2 text-heading-sm font-bold"
        id="course-curriculum-title"
      >
        커리큘럼
      </h2>
      <Accordion
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
    <AccordionItem value={unit.id}>
      <AccordionTrigger>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex justify-center items-center font-black shrink-0",
              unitDone
                ? "bg-success text-success-foreground"
                : "bg-bg-surface text-fg-default"
            )}
          >
            {unitDone ? (
              <CheckIcon size={18} />
            ) : (
              <span className="text-label-md">{unitIndex + 1}</span>
            )}
          </div>
          <div>
            <div className="text-title-md font-bold">{unit.title}</div>
            <div className="mt-1 text-label-sm font-medium text-muted-foreground">
              {completedCount}/{totalCount}개 레슨
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-1 pb-1">
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
        : "이동 가능"
  const accessibleName = `${lesson.title}, ${statusLabel}, ${lesson.estimatedMinutes}분`

  const className = cn(
    "flex min-h-14 items-center gap-3 py-3.5 pl-4 -mr-2 pr-3 rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    locked
      ? "cursor-not-allowed opacity-55"
      : isCurrent
        ? "bg-action-selected-bg/35 hover:bg-action-selected-bg/45"
        : "hover:bg-muted/15"
  )
  const content = (
    <>
      <div className="w-8 shrink-0 flex justify-center">
        <div
          aria-hidden="true"
          className={cn(
            "w-7 h-7 rounded-full flex justify-center items-center",
            done
              ? "bg-success text-success-foreground"
              : locked
                ? "bg-bg-surface text-fg-muted"
                : isCurrent
                  ? "bg-action-selected-bg text-action-selected-fg"
                  : "bg-bg-surface text-fg-default"
          )}
        >
          {done ? (
            <CheckIcon size={14} />
          ) : locked ? (
            <LockIcon size={14} />
          ) : (
            <PlayIcon fill="currentColor" size={12} />
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <div
            className={cn(
              "text-body-sm font-bold",
              locked ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {lesson.title}
          </div>
          {isCurrent && !locked ? (
            <span className="text-label-sm font-bold text-fg-default">
              다음
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 text-label-sm font-medium text-muted-foreground">
          {lesson.estimatedMinutes}분
        </div>
      </div>
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
