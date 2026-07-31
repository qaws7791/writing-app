"use client"

import type { Lesson } from "@/features/lesson-session/model/lesson-view-model"
import {
  LessonIntroHeader,
  LessonShell,
} from "@/features/lesson-session/ui/lesson-shell"
import { LayersIcon } from "@workspace/ui/components/icons"
import { Button } from "@workspace/ui/components/ui/button"
import { Callout, CalloutContent } from "@workspace/ui/components/ui/callout"
import { Spinner } from "@workspace/ui/components/ui/spinner"
import { StickyActionBar } from "@workspace/ui/components/ui/sticky-action-bar"

const LESSON_TITLE_ID = "lesson-start-title"

export function LessonStartScreen({
  isInteractive,
  isSavingStart,
  lesson,
  onExit,
  onStart,
  startError,
}: {
  readonly isInteractive: boolean
  readonly isSavingStart: boolean
  readonly lesson: Lesson
  readonly onExit: () => void
  readonly onStart: () => void
  readonly startError: null | string
}) {
  return (
    <LessonShell
      contentLabelledBy={LESSON_TITLE_ID}
      fixedFooter
      footer={
        <StickyActionBar
          className="pointer-events-auto mx-auto max-w-2xl"
          tone="plain"
        >
          <Button
            aria-busy={isSavingStart || undefined}
            className="w-full"
            disabled={!isInteractive || isSavingStart}
            onClick={onStart}
            size="extra"
          >
            {isSavingStart ? (
              <>
                <Spinner aria-hidden data-icon="inline-start" />
                시작하는 중…
              </>
            ) : (
              "시작하기"
            )}
          </Button>
        </StickyActionBar>
      }
      header={<LessonIntroHeader onExit={onExit} />}
    >
      <div className="an-fi">
        {lesson.category === null ? null : (
          <div className="mb-4 text-label-sm font-bold text-muted-foreground">
            {lesson.category}
          </div>
        )}
        <h1 className="mb-6 text-heading-xl font-bold" id={LESSON_TITLE_ID}>
          {lesson.title}
        </h1>
        {lesson.description === null ? null : (
          <p className="mb-8 text-body-lg font-medium text-muted-foreground">
            {lesson.description}
          </p>
        )}
        <div className="flex gap-6 text-body-sm font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <LayersIcon aria-hidden size={18} />
            {`${lesson.steps.length}개 활동`}
          </span>
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
