"use client"

import type { Ref } from "react"

import type { LessonStepAnswerPayload } from "@/features/lesson-session/model/lesson-logic"
import { useLessonContentEndReached } from "@/features/lesson-session/hooks/use-lesson-content-end-reached"
import type { LessonStepCheckedState } from "@/features/lesson-session/model/lesson-step-policy"
import {
  getLessonStepActionLabel,
  getLessonStepPendingLabel,
} from "@/features/lesson-session/model/lesson-step-policy"
import { LessonStepRenderer } from "@/features/lesson-session/ui/lesson-step-renderer"
import type {
  Lesson,
  LessonStep,
} from "@/features/lesson-session/model/lesson-view-model"
import {
  LessonCheckedFooter,
  LessonProgressHeader,
  LessonShell,
} from "@/features/lesson-session/ui/lesson-shell"
import { LessonExitModal } from "@/features/lesson-session/ui/lesson-exit-modal"
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

type LessonCheckedState = false | LessonStepCheckedState

export function LessonActiveScreen({
  answerError,
  answerPayload,
  checked,
  completeError,
  contentRef,
  currentStep,
  currentStepIndex,
  exitError,
  isReady,
  isLeaving,
  isSubmitting,
  lesson,
  onAnswerPayloadChange,
  onCancelExit,
  onConfirmExit,
  onDraftFlush,
  onExit,
  onContinueLessonStep,
  onRetryLessonStep,
  onSkipIncorrectLessonStep,
  onSubmitCurrentStep,
  progress,
  renderRevision,
  showExit,
  visibleStepNumber,
}: {
  readonly answerError: null | string
  readonly answerPayload: LessonStepAnswerPayload | undefined
  readonly checked: LessonCheckedState
  readonly completeError: null | string
  readonly contentRef: Ref<HTMLElement>
  readonly currentStep: LessonStep
  readonly currentStepIndex: number
  readonly exitError: null | string
  readonly isReady: boolean
  readonly isLeaving: boolean
  readonly isSubmitting: boolean
  readonly lesson: Lesson
  readonly onAnswerPayloadChange: (change: {
    readonly payload: LessonStepAnswerPayload
    readonly stepId: string
  }) => void
  readonly onCancelExit: () => void
  readonly onConfirmExit: () => void
  readonly onContinueLessonStep: () => void
  readonly onDraftFlush: () => void
  readonly onExit: () => void
  readonly onRetryLessonStep: () => void
  readonly onSkipIncorrectLessonStep: () => void
  readonly onSubmitCurrentStep: () => void
  readonly progress: number
  readonly renderRevision: number
  readonly showExit: boolean
  readonly visibleStepNumber: number
}) {
  const shouldGateAcknowledge =
    checked === false &&
    (currentStep.type === "COMPARE" || currentStep.type === "READING")
  const hasReachedContentEnd = useLessonContentEndReached({
    contentRef,
    enabled: shouldGateAcknowledge,
    stepId: currentStep.id,
  })
  const canSubmit = isReady && (!shouldGateAcknowledge || hasReachedContentEnd)
  const readEndHintId = "lesson-read-end-hint"

  return (
    <LessonShell
      contentRef={contentRef}
      footer={
        checked === false ? (
          <LessonFooter aria-label="레슨 행동">
            <LessonActions>
              {shouldGateAcknowledge && !hasReachedContentEnd ? (
                <span className="sr-only" id={readEndHintId}>
                  본문 끝까지 내린 뒤에 이해할 수 있습니다
                </span>
              ) : null}
              <Button
                aria-describedby={
                  shouldGateAcknowledge && !hasReachedContentEnd
                    ? readEndHintId
                    : undefined
                }
                disabled={!canSubmit || isSubmitting}
                onClick={onSubmitCurrentStep}
                size="lg"
                variant={canSubmit ? "default" : "secondary"}
              >
                {isSubmitting
                  ? getLessonStepPendingLabel(currentStep)
                  : getLessonStepActionLabel(currentStep)}
              </Button>
            </LessonActions>
          </LessonFooter>
        ) : (
          <LessonCheckedFooter
            checked={checked}
            isSubmitting={isSubmitting}
            onContinue={() => {
              if (checked.correct) {
                onContinueLessonStep()
                return
              }
              void onSkipIncorrectLessonStep()
            }}
            onRetry={onRetryLessonStep}
          />
        )
      }
      header={
        <LessonProgressHeader
          currentStepNumber={visibleStepNumber}
          onExit={onExit}
          progress={progress}
          totalStepCount={lesson.steps.length}
        />
      }
    >
      <div className="flex flex-col gap-4" onBlurCapture={onDraftFlush}>
        <LessonStepRenderer
          answerError={answerError}
          checked={checked}
          onAnswerPayloadChange={onAnswerPayloadChange}
          key={`${currentStepIndex}:${renderRevision}`}
          step={currentStep}
          {...(answerPayload === undefined ? {} : { answerPayload })}
        />
        {completeError === null ? null : (
          <Insight role="alert" tone="incorrect">
            <InsightEyebrow>답을 확인하지 못했어요</InsightEyebrow>
            <InsightDescription>{completeError}</InsightDescription>
          </Insight>
        )}
      </div>
      {showExit ? (
        <LessonExitModal
          error={exitError}
          isLeaving={isLeaving}
          onCancel={onCancelExit}
          onConfirm={onConfirmExit}
        />
      ) : null}
    </LessonShell>
  )
}
