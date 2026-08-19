"use client"

import { listLessonActivityKindLabels } from "@/features/lesson-session/model/lesson-activity-labels"
import type { Lesson } from "@/features/lesson-session/model/lesson-view-model"
import {
  LessonIntroHeader,
  LessonShell,
} from "@/features/lesson-session/ui/lesson-shell"
import { LayersIcon } from "@workspace/ui/components/icons/navigation-icons"
import { Badge } from "@workspace/ui/components/primitives/badge"
import { Button } from "@workspace/ui/components/primitives/button"
import {
  Insight,
  InsightDescription,
  InsightEyebrow,
} from "@workspace/ui/components/learning/insight"
import {
  LessonActions,
  LessonFooter,
} from "@workspace/ui/components/learning/lesson"
import { Spinner } from "@workspace/ui/components/primitives/spinner"
import {
  Step,
  StepBody,
  StepEyebrow,
  StepHeader,
  StepPrompt,
  StepTitle,
} from "@workspace/ui/components/learning/step"

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
        <LessonFooter aria-label="레슨 행동">
          <LessonActions>
            <Button
              aria-busy={isSavingStart || undefined}
              disabled={!isInteractive || isSavingStart}
              onClick={onStart}
              size="lg"
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
          </LessonActions>
        </LessonFooter>
      }
      header={<LessonIntroHeader onExit={onExit} />}
    >
      <Step className="my-auto w-full min-w-0 py-10">
        <StepHeader className="w-full">
          {lesson.category === null ? null : (
            <StepEyebrow>{lesson.category}</StepEyebrow>
          )}
          <StepTitle className="w-full break-keep [text-wrap:wrap]">
            <h1 id={LESSON_TITLE_ID}>{lesson.title}</h1>
          </StepTitle>
          {lesson.description === null ? null : (
            <StepPrompt>{lesson.description}</StepPrompt>
          )}
        </StepHeader>
        <StepBody>
          <Badge variant="outline">
            <LayersIcon aria-hidden data-icon="inline-start" />
            {`${lesson.steps.length}개 활동`}
          </Badge>
          <ul className="flex flex-col gap-1.5 text-sm leading-6 text-foreground">
            {listLessonActivityKindLabels(lesson.steps).map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
          {startError === null ? null : (
            <Insight role="alert" tone="incorrect">
              <InsightEyebrow>레슨을 시작하지 못했어요</InsightEyebrow>
              <InsightDescription>{startError}</InsightDescription>
            </Insight>
          )}
        </StepBody>
      </Step>
    </LessonShell>
  )
}
