"use client"

import type { Ref } from "react"

import type {
  LessonAiFeedbackOutcome,
  LessonAiFeedbackRequest,
  LessonAnswerChange,
  LessonStepAnswerPayload,
} from "@/features/lessons/lesson-logic"
import type { LessonStepCheckedState } from "@/features/lessons/lesson-step-policy"
import { getLessonStepActionLabel } from "@/features/lessons/lesson-step-policy"
import { LessonStepRenderer } from "@/features/lessons/lesson-step-renderer"
import type { Lesson, LessonStep } from "@/features/lessons/lesson-types"
import {
  LessonCheckedFooter,
  LessonProgressHeader,
  LessonShell,
} from "@/features/lessons/lesson-shell"
import { LessonExitModal } from "@/features/lessons/lesson-exit-modal"
import { Button } from "@workspace/ui/components/ui/button"
import { Callout, CalloutContent } from "@workspace/ui/components/ui/callout"
import { StickyActionBar } from "@workspace/ui/components/ui/sticky-action-bar"

type LessonCheckedState = false | LessonStepCheckedState

export function LessonActiveScreen({
  answerError,
  checked,
  completeError,
  contentRef,
  currentStep,
  currentStepIndex,
  isCompleting,
  isReady,
  lesson,
  onAiFeedbackRequest,
  onAnswerChange,
  onAnswerPayloadChange,
  onCancelExit,
  onConfirmExit,
  onExit,
  onSubmitCurrentStep,
  progress,
  showExit,
  visibleStepNumber,
}: {
  readonly answerError: null | string
  readonly checked: LessonCheckedState
  readonly completeError: null | string
  readonly contentRef: Ref<HTMLElement>
  readonly currentStep: LessonStep
  readonly currentStepIndex: number
  readonly isCompleting: boolean
  readonly isReady: boolean
  readonly lesson: Lesson
  readonly onAiFeedbackRequest: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackOutcome>
  readonly onAnswerChange: (change: LessonAnswerChange) => Promise<void>
  readonly onAnswerPayloadChange: (change: {
    readonly payload: LessonStepAnswerPayload
    readonly stepId: string
  }) => void
  readonly onCancelExit: () => void
  readonly onConfirmExit: () => void
  readonly onExit: () => void
  readonly onSubmitCurrentStep: () => void
  readonly progress: number
  readonly showExit: boolean
  readonly visibleStepNumber: number
}) {
  return (
    <LessonShell
      contentRef={contentRef}
      footer={
        checked === false ? (
          <StickyActionBar className="mx-auto max-w-2xl">
            <Button
              className="w-full"
              disabled={!isReady || isCompleting}
              onClick={onSubmitCurrentStep}
              size="lg"
              variant={isReady ? "default" : "secondary"}
            >
              {isCompleting
                ? "완료 저장 중"
                : getLessonStepActionLabel(currentStep)}
            </Button>
          </StickyActionBar>
        ) : (
          <LessonCheckedFooter
            checked={checked}
            onNext={onSubmitCurrentStep}
            step={currentStep}
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
      <div className="an-fi">
        <LessonStepRenderer
          answerError={answerError}
          checked={checked}
          onAiFeedbackRequest={onAiFeedbackRequest}
          onAnswerChange={onAnswerChange}
          onAnswerPayloadChange={onAnswerPayloadChange}
          key={currentStepIndex}
          step={currentStep}
        />
        {completeError === null ? null : (
          <Callout className="mt-6" role="alert" tone="danger">
            <CalloutContent>{completeError}</CalloutContent>
          </Callout>
        )}
      </div>
      {showExit ? (
        <LessonExitModal onCancel={onCancelExit} onConfirm={onConfirmExit} />
      ) : null}
    </LessonShell>
  )
}
