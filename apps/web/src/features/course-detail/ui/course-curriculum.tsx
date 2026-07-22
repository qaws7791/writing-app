"use client"

import Link from "next/link"

import type {
  LearnerCourseDetail,
  LessonLearningState,
} from "@workspace/contracts/learning/learner-content"
import { CheckIcon, LockIcon, PlayIcon } from "@workspace/ui/components/icons"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/ui/accordion"
import { cn } from "@workspace/ui/lib/utils"

type CourseCurriculumProps = {
  readonly course: LearnerCourseDetail
}

type CourseUnit = LearnerCourseDetail["units"][number]
type CourseLessonSummary = CourseUnit["lessons"][number]

export function CourseCurriculum({ course }: CourseCurriculumProps) {
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
          <CurriculumUnit key={unit.id} unit={unit} unitIndex={unitIndex} />
        ))}
      </Accordion>
    </section>
  )
}

function CurriculumUnit({
  unit,
  unitIndex,
}: {
  readonly unit: CourseUnit
  readonly unitIndex: number
}) {
  const unitDone = unit.lessons.every(
    (lesson) => lesson.learning.status === "completed"
  )

  return (
    <AccordionItem value={unit.id}>
      <AccordionTrigger>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex justify-center items-center font-black shrink-0",
              unitDone
                ? "bg-mint-light text-charcoal"
                : "bg-charcoal/15 text-charcoal"
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
              status={lesson.learning.status}
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
  readonly status: LessonLearningState["status"]
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
              ? "bg-mint-light text-charcoal"
              : locked
                ? "bg-charcoal/15 text-muted-foreground"
                : "bg-charcoal/15 text-charcoal"
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
