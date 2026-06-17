"use client"

/* eslint-disable react/button-has-type */

import { useMemo, useState } from "react"

import { useRouter } from "next/navigation"

import type {
  CourseDetail,
  CourseLessonSummary,
  CourseUnit,
  LessonProgressStatus,
} from "@/features/courses/course-types"
import {
  CheckIcon,
  ChevronDownIcon,
  LockIcon,
  PlayIcon,
} from "@workspace/ui/components/icons"

type CourseCurriculumProps = {
  readonly course: CourseDetail
}

export function CourseCurriculum({ course }: CourseCurriculumProps) {
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      course.units.map((unit, index) => [unit.id, index === 0])
    )
  )
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
    <>
      <h3 className="font-bold mb-2" style={{ fontSize: "1.5rem" }}>
        커리큘럼
      </h3>
      <div>
        {course.units.map((unit, unitIndex) => (
          <CurriculumUnit
            isOpen={openUnits[unit.id] ?? false}
            key={unit.id}
            onToggle={() =>
              setOpenUnits((current) => ({
                ...current,
                [unit.id]: !(current[unit.id] ?? false),
              }))
            }
            progressByLessonId={progressByLessonId}
            unit={unit}
            unitIndex={unitIndex}
          />
        ))}
      </div>
    </>
  )
}

function CurriculumUnit({
  isOpen,
  onToggle,
  progressByLessonId,
  unit,
  unitIndex,
}: {
  readonly isOpen: boolean
  readonly onToggle: () => void
  readonly progressByLessonId: ReadonlyMap<string, LessonProgressStatus>
  readonly unit: CourseUnit
  readonly unitIndex: number
}) {
  const unitDone = unit.lessons.every(
    (lesson) =>
      resolveLessonStatus(progressByLessonId, lesson.id) === "completed"
  )

  return (
    <div className="border-b border-charcoal/10">
      <button
        className="w-full py-5 flex items-center justify-between text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div
            className={cx(
              "w-10 h-10 rounded-full flex justify-center items-center font-black shrink-0",
              unitDone
                ? "bg-mint-light text-charcoal"
                : "bg-charcoal/15 text-charcoal"
            )}
          >
            {unitDone ? (
              <CheckIcon size={18} />
            ) : (
              <span style={{ fontSize: "0.875rem" }}>{unitIndex + 1}</span>
            )}
          </div>
          <div>
            <div className="font-bold" style={{ fontSize: "1.125rem" }}>
              {unit.title}
            </div>
            <div
              className="text-muted font-medium mt-1"
              style={{ fontSize: "0.8125rem" }}
            >
              {unit.lessons.length}개 레슨
            </div>
          </div>
        </div>
        <ChevronDownIcon
          className="transition-transform duration-300 text-muted"
          size={22}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          transition: "grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="overflow-hidden">
          <div className="pb-4">
            {unit.lessons.map((lesson) => (
              <CurriculumLesson
                key={lesson.id}
                lesson={lesson}
                status={resolveLessonStatus(progressByLessonId, lesson.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CurriculumLesson({
  lesson,
  status,
}: {
  readonly lesson: CourseLessonSummary
  readonly status: LessonProgressStatus
}) {
  const router = useRouter()
  const done = status === "completed"
  const locked = status === "locked"

  return (
    <div
      className={cx(
        "flex items-center gap-3 py-3 pl-6 -mr-2 pr-2 rounded-2xl transition-colors",
        locked
          ? "cursor-not-allowed"
          : "cursor-pointer hover:bg-charcoal/[0.04]"
      )}
      onClick={() => {
        if (!locked) {
          router.push(`/app/lesson?lesson_id=${lesson.id}`)
        }
      }}
    >
      <div className="w-7 shrink-0 flex justify-center">
        <div
          className={cx(
            "w-6 h-6 rounded-full flex justify-center items-center",
            done
              ? "bg-mint-light text-charcoal"
              : locked
                ? "bg-charcoal/10 text-charcoal/40"
                : "bg-charcoal/10 text-charcoal"
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
          className={cx("font-bold", locked ? "text-muted" : "")}
          style={{ fontSize: "0.9375rem" }}
        >
          {lesson.title}
        </div>
        <div
          className={cx("font-medium", locked ? "text-muted" : "text-muted")}
          style={{ fontSize: "0.8125rem" }}
        >
          {lesson.estimatedMinutes}분
        </div>
      </div>
    </div>
  )
}

function resolveLessonStatus(
  progressByLessonId: ReadonlyMap<string, LessonProgressStatus>,
  lessonId: string
): LessonProgressStatus {
  return progressByLessonId.get(lessonId) ?? "locked"
}

function cx(...classes: Array<false | null | string | undefined>): string {
  return classes.filter(Boolean).join(" ")
}
