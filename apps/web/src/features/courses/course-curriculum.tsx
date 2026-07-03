"use client"

import { useMemo } from "react"

import Link from "next/link"

import type {
  CourseDetail,
  CourseLessonSummary,
  CourseUnit,
  LessonProgressStatus,
} from "@/features/courses/course-types"
import { CheckIcon, LockIcon, PlayIcon } from "@workspace/ui/components/icons"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/ui/accordion"
import { cn } from "@workspace/ui/lib/utils"

type CourseCurriculumProps = {
  readonly course: CourseDetail
}

export function CourseCurriculum({ course }: CourseCurriculumProps) {
  const progressByLessonId = useMemo(
    () =>
      new Map(
        course.progress.lessons.map((lesson) => [
          lesson.lessonId,
          lesson.status,
        ])
      ),
    [course.progress.lessons]
  )

  return (
    <section aria-labelledby="course-curriculum-title">
      <h3
        className="mb-2 text-heading-sm font-bold"
        id="course-curriculum-title"
      >
        커리큘럼
      </h3>
      <Accordion
        defaultValue={course.units[0] ? [course.units[0].id] : []}
        multiple
      >
        {course.units.map((unit, unitIndex) => (
          <CurriculumUnit
            key={unit.id}
            progressByLessonId={progressByLessonId}
            unit={unit}
            unitIndex={unitIndex}
          />
        ))}
      </Accordion>
    </section>
  )
}

function CurriculumUnit({
  progressByLessonId,
  unit,
  unitIndex,
}: {
  readonly progressByLessonId: ReadonlyMap<string, LessonProgressStatus>
  readonly unit: CourseUnit
  readonly unitIndex: number
}) {
  const unitDone = unit.lessons.every(
    (lesson) =>
      resolveLessonStatus(progressByLessonId, lesson.id) === "completed"
  )

  return (
    <AccordionItem value={unit.id}>
      <AccordionTrigger>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex justify-center items-center font-black shrink-0",
              unitDone
                ? "bg-success text-success-foreground"
                : "bg-surface-hover text-foreground"
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
              {unit.lessons.length}개 레슨
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-1 pb-1">
          {unit.lessons.map((lesson) => (
            <CurriculumLesson
              key={lesson.id}
              lesson={lesson}
              status={resolveLessonStatus(progressByLessonId, lesson.id)}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

function CurriculumLesson({
  lesson,
  status,
}: {
  readonly lesson: CourseLessonSummary
  readonly status: LessonProgressStatus
}) {
  const done = status === "completed"
  const locked = status === "locked"
  const className = cn(
    "flex items-center gap-3 py-3 pl-6 -mr-2 pr-2 rounded-2xl transition-colors",
    locked ? "cursor-not-allowed" : "hover:bg-muted/10"
  )
  const content = (
    <>
      <div className="w-7 shrink-0 flex justify-center">
        <div
          className={cn(
            "w-6 h-6 rounded-full flex justify-center items-center",
            done
              ? "bg-success text-success-foreground"
              : locked
                ? "bg-surface-hover text-muted-foreground"
                : "bg-surface-hover text-foreground"
          )}
        >
          {done ? (
            <CheckIcon size={10} />
          ) : locked ? (
            <LockIcon size={10} />
          ) : (
            <PlayIcon fill="currentColor" size={9} />
          )}
        </div>
      </div>
      <div className="flex-1">
        <div
          className={cn(
            "text-body-sm font-bold",
            locked ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {lesson.title}
        </div>
        <div className="text-label-sm font-medium text-muted-foreground">
          {lesson.estimatedMinutes}분
        </div>
      </div>
    </>
  )

  if (locked) {
    return (
      <div aria-disabled="true" className={className}>
        {content}
      </div>
    )
  }

  return (
    <Link
      className={className}
      href={`/app/lesson?lesson_id=${encodeURIComponent(lesson.id)}`}
    >
      {content}
    </Link>
  )
}

function resolveLessonStatus(
  progressByLessonId: ReadonlyMap<string, LessonProgressStatus>,
  lessonId: string
): LessonProgressStatus {
  return progressByLessonId.get(lessonId) ?? "locked"
}
