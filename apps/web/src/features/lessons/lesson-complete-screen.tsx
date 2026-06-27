"use client"

import type { CourseDetail } from "@/features/courses/course-types"
import { getNextCourseLesson } from "@/features/lessons/lesson-next-course-lesson"
import type { Lesson } from "@/features/lessons/lesson-types"
import { Button } from "@workspace/ui/components/ui/button"
import { Surface } from "@workspace/ui/components/ui/surface"

export function LessonCompleteScreen({
  courseDetail,
  lesson,
  onCourse,
  onNext,
}: {
  readonly courseDetail?: CourseDetail
  readonly lesson: Lesson
  readonly onCourse: () => void
  readonly onNext: (nextLessonId: string) => void
}) {
  const points = lesson.summary
  const nextLesson = getNextCourseLesson(courseDetail, lesson.id)
  const totalLessons = courseDetail?.progress.totalLessons ?? 1
  const completedLessons = Math.min(
    totalLessons,
    (courseDetail?.progress.completedLessons ?? 0) + 1
  )

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-full flex-col overflow-y-auto bg-action-selected-bg text-action-selected-fg">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center text-center px-6 py-16 my-auto an-fi">
        <div className="mb-4 text-display-lg" aria-hidden="true">
          🙌
        </div>
        <h1 className="mb-3 text-display-md font-black">완료!</h1>
        <p className="mb-10 text-body-lg font-bold">
          오늘의 학습이 저장되었습니다.
        </p>
        {points.length > 0 ? (
          <Surface
            className="mb-6 w-full rounded-5xl bg-bg-canvas text-left"
            size="lg"
            variant="panel"
          >
            <p className="mb-5 text-label-md font-black uppercase text-fg-muted">
              이번 레슨 핵심 요약
            </p>
            <ul className="space-y-4">
              {points.map((point, index) => (
                <li className="flex items-start gap-4" key={point}>
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-action-selected-bg text-label-md font-black text-action-selected-fg">
                    {index + 1}
                  </div>
                  <p className="text-body-md font-medium">{point}</p>
                </li>
              ))}
            </ul>
          </Surface>
        ) : null}
        <Surface
          className="mb-10 flex w-full flex-row items-center justify-around rounded-5xl bg-bg-canvas text-center"
          size="lg"
          variant="panel"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-label-md font-bold text-fg-muted">
              완료한 레슨
            </span>
            <span className="text-heading-lg font-black text-fg-default">
              +1
            </span>
          </div>
          <div className="h-12 w-px rounded-full bg-bg-surface" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-label-md font-bold text-fg-muted">
              코스 진행률
            </span>
            <span className="text-heading-lg font-black text-fg-default">
              {completedLessons}/{totalLessons}
            </span>
          </div>
        </Surface>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {nextLesson === null ? null : (
            <Button
              className="w-full"
              onClick={() => onNext(nextLesson.id)}
              size="lg"
            >
              다음 레슨 →
            </Button>
          )}
          <Button
            className="w-full"
            onClick={onCourse}
            size="lg"
            variant="secondary"
          >
            코스로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  )
}
