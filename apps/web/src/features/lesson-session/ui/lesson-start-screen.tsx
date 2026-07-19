"use client"

import type { LearnerLesson as Lesson } from "@workspace/contracts/learning"
import {
  LessonIntroHeader,
  LessonShell,
} from "@/features/lesson-session/ui/lesson-shell"
import { Button } from "@workspace/ui/components/ui/button"
import { Callout, CalloutContent } from "@workspace/ui/components/ui/callout"
import { StickyActionBar } from "@workspace/ui/components/ui/sticky-action-bar"

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
      fixedFooter
      footer={
        <StickyActionBar className="pointer-events-auto mx-auto max-w-2xl">
          <Button
            className="w-full"
            disabled={!canStart || isSavingStart}
            onClick={onStart}
            size="extra"
          >
            {isSavingStart ? "저장 중" : "시작하기"}
          </Button>
        </StickyActionBar>
      }
      header={<LessonIntroHeader onExit={onExit} />}
    >
      <div className="an-fi">
        {lesson.category === null ? null : (
          <div className="mb-4 text-label-sm font-bold uppercase text-muted-foreground tracking-widest">
            {lesson.category}
          </div>
        )}
        <h1 className="mb-6 text-heading-xl font-bold">{lesson.title}</h1>
        {lesson.description === null ? null : (
          <p className="mb-8 text-body-lg font-medium text-muted-foreground">
            {lesson.description}
          </p>
        )}
        <div className="flex gap-6 text-body-sm font-medium text-muted-foreground">
          <span>⏱ {lesson.estimatedMinutes}분</span>
          <span>📚 {lesson.steps.length}개 스텝</span>
        </div>
        {startError === null ? null : (
          <Callout className="mt-8" role="alert" tone="danger">
            <CalloutContent>{startError}</CalloutContent>
          </Callout>
        )}
      </div>
    </LessonShell>
  )
}
