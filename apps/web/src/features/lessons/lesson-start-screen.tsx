"use client"

import type { Lesson } from "@/features/lessons/lesson-types"
import {
  LessonPrimaryButton,
  LessonProgressHeader,
  LessonShell,
} from "@/features/lessons/lesson-shell"

export function LessonStartScreen({
  canStart,
  isSavingStart,
  lesson,
  onExit,
  onStart,
  startError,
}: {
  readonly canStart: boolean
  readonly isSavingStart: boolean
  readonly lesson: Lesson
  readonly onExit: () => void
  readonly onStart: () => void
  readonly startError: null | string
}) {
  return (
    <LessonShell
      footer={
        <div className="w-full max-w-2xl px-6 pb-8 pt-10 bg-gradient-to-t from-cream via-cream to-transparent">
          <LessonPrimaryButton
            disabled={!canStart || isSavingStart}
            onClick={onStart}
          >
            {isSavingStart ? "저장 중" : "시작하기"}
          </LessonPrimaryButton>
        </div>
      }
      header={
        <LessonProgressHeader
          currentStepNumber={0}
          onExit={onExit}
          progress={0}
          totalStepCount={lesson.steps.length}
        />
      }
    >
      <div className="an-fi">
        {lesson.category === null ? null : (
          <div
            className="font-bold text-muted tracking-widest mb-4"
            style={{ fontSize: "0.8125rem" }}
          >
            {lesson.category}
          </div>
        )}
        <h1
          className="font-bold mb-6"
          style={{ fontSize: "2.5rem", lineHeight: 1.2 }}
        >
          {lesson.title}
        </h1>
        {lesson.description === null ? null : (
          <p
            className="text-muted font-medium mb-8"
            style={{ fontSize: "1.125rem" }}
          >
            {lesson.description}
          </p>
        )}
        <div
          className="flex gap-6 text-muted font-medium"
          style={{ fontSize: "0.9375rem" }}
        >
          <span>⏱ {lesson.estimatedMinutes}분</span>
          <span>📚 {lesson.steps.length}개 스텝</span>
        </div>
        {startError === null ? null : (
          <p className="mt-8 rounded-2xl bg-coral/10 px-4 py-3 text-coral-dark font-bold">
            {startError}
          </p>
        )}
      </div>
    </LessonShell>
  )
}
