"use client"

import type { Ref } from "react"

import type {
  LessonAiFeedbackOutcome,
  LessonAiFeedbackRequest,
  LessonAiFeedbackSkipOutcome,
  LessonStepAnswerPayload,
} from "@/features/lesson-session/model/lesson-logic"
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
import { Button } from "@workspace/ui/components/ui/button"
import {
  Insight,
  InsightDescription,
  InsightEyebrow,
} from "@workspace/ui/components/ui/insight"
import { LessonActions, LessonFooter } from "@workspace/ui/components/ui/lesson"

type LessonCheckedState = false | LessonStepCheckedState

export function LessonActiveScreen({
  aiFeedbackDraftText,
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
  onAiFeedbackRequest,
  onAiFeedbackSkip,
  onAnswerPayloadChange,
  onCancelExit,
  onConfirmExit,
  onDraftFlush,
  onExit,
  onSubmitCurrentStep,
  progress,
  renderRevision,
  showExit,
  visibleStepNumber,
}: {
  readonly aiFeedbackDraftText: string
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
  readonly onAiFeedbackRequest: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackOutcome>
  readonly onAiFeedbackSkip: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackSkipOutcome>
  readonly onAnswerPayloadChange: (change: {
    readonly payload: LessonStepAnswerPayload
    readonly stepId: string
  }) => void
  readonly onCancelExit: () => void
  readonly onConfirmExit: () => void
  readonly onDraftFlush: () => void
  readonly onExit: () => void
  readonly onSubmitCurrentStep: () => void
  readonly progress: number
  readonly renderRevision: number
  readonly showExit: boolean
  readonly visibleStepNumber: number
}) {
  return (
    <LessonShell
      contentRef={contentRef}
      footer={
        checked === false ? (
          <LessonFooter aria-label="레슨 행동">
            <LessonActions>
              <Button
                disabled={!isReady || isSubmitting}
                onClick={onSubmitCurrentStep}
                size="lg"
                variant={isReady ? "default" : "secondary"}
              >
                {isSubmitting
                  ? getLessonStepPendingLabel(currentStep)
                  : getLessonStepActionLabel(currentStep)}
              </Button>
            </LessonActions>
          </LessonFooter>
        ) : (
          <LessonCheckedFooter checked={checked} onNext={onSubmitCurrentStep} />
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
          aiFeedbackDraftText={aiFeedbackDraftText}
          answerError={answerError}
          checked={checked}
          onAiFeedbackRequest={onAiFeedbackRequest}
          onAiFeedbackSkip={onAiFeedbackSkip}
          onAnswerPayloadChange={onAnswerPayloadChange}
          key={`${currentStepIndex}:${renderRevision}`}
          step={currentStep}
          {...(answerPayload === undefined ? {} : { answerPayload })}
        />
        {completeError === null || currentStep.type === "AI_FEEDBACK" ? null : (
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
