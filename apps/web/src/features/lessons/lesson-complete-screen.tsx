"use client"

import type { CourseDetail } from "@/features/courses/course-types"
import { getNextCourseLesson } from "@/features/lessons/lesson-next-course-lesson"
import type { Lesson } from "@/features/lessons/lesson-types"
import { LessonPrimaryButton } from "@/features/lessons/lesson-shell"

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
    <div className="flex flex-col min-h-screen bg-primary w-full fixed inset-0 z-50 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center text-center px-6 py-16 my-auto an-fi">
        <div className="mb-4" style={{ fontSize: "5rem" }}>
          🙌
        </div>
        <h1
          className="font-black mb-3 text-ink"
          style={{ fontSize: "2.75rem" }}
        >
          완료!
        </h1>
        <p
          className="text-ink font-bold mb-10"
          style={{ fontSize: "1.125rem" }}
        >
          오늘의 학습이 저장되었습니다.
        </p>
        {points.length > 0 ? (
          <div className="w-full bg-cream rounded-5xl p-7 mb-6 text-left">
            <p
              className="font-black text-muted mb-5"
              style={{ fontSize: "0.8125rem", letterSpacing: "0.06em" }}
            >
              이번 레슨 핵심 요약
            </p>
            <ul className="space-y-4">
              {points.map((point, index) => (
                <li className="flex items-start gap-4" key={point}>
                  <div
                    className="w-7 h-7 bg-primary rounded-full flex justify-center items-center font-black text-ink shrink-0"
                    style={{ fontSize: "0.875rem" }}
                  >
                    {index + 1}
                  </div>
                  <p
                    className="font-medium leading-relaxed"
                    style={{ fontSize: "1rem" }}
                  >
                    {point}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="w-full bg-cream rounded-5xl p-7 mb-10 flex flex-row justify-around items-center text-center">
          <div className="flex flex-col items-center gap-1">
            <span
              className="font-bold text-muted"
              style={{ fontSize: "0.875rem" }}
            >
              완료한 레슨
            </span>
            <span
              className="font-black text-charcoal"
              style={{ fontSize: "2rem" }}
            >
              +1
            </span>
          </div>
          <div className="w-px h-12 bg-surface rounded-full" />
          <div className="flex flex-col items-center gap-1">
            <span
              className="font-bold text-muted"
              style={{ fontSize: "0.875rem" }}
            >
              코스 진행률
            </span>
            <span
              className="font-black text-charcoal"
              style={{ fontSize: "2rem" }}
            >
              {completedLessons}/{totalLessons}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {nextLesson === null ? null : (
            <LessonPrimaryButton onClick={() => onNext(nextLesson.id)}>
              다음 레슨 →
            </LessonPrimaryButton>
          )}
          <LessonPrimaryButton onClick={onCourse} variant="secondary">
            코스로 돌아가기
          </LessonPrimaryButton>
        </div>
      </div>
    </div>
  )
}
