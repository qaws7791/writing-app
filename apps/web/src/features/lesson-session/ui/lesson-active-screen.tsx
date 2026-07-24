"use client"

import type { Ref } from "react"

import type {
  LessonAiFeedbackOutcome,
  LessonAiFeedbackRequest,
  LessonAiFeedbackSkipOutcome,
  LessonStepAnswerPayload,
} from "@/features/lesson-session/model/lesson-logic"
import type { LessonDraftSyncStatus } from "@/features/lesson-session/hooks/use-lesson-draft-sync"
import type { LessonStepCheckedState } from "@/features/lesson-session/model/lesson-step-policy"
import { getLessonStepActionLabel } from "@/features/lesson-session/model/lesson-step-policy"
import { LessonDraftStatus } from "@/features/lesson-session/ui/lesson-draft-status"
import { LessonStepRenderer } from "@/features/lesson-session/ui/lesson-step-renderer"
import type {
  LearnerLessonDto as Lesson,
  LearnerLessonStepDto as LessonStep,
} from "@/shared/http/learner-api-client"
import {
  LessonCheckedFooter,
  LessonProgressHeader,
  LessonShell,
} from "@/features/lesson-session/ui/lesson-shell"
import { LessonExitModal } from "@/features/lesson-session/ui/lesson-exit-modal"
import { Button } from "@workspace/ui/components/ui/button"
import { Callout, CalloutContent } from "@workspace/ui/components/ui/callout"
import { StickyActionBar } from "@workspace/ui/components/ui/sticky-action-bar"

type LessonCheckedState = false | LessonStepCheckedState

export function LessonActiveScreen({
  aiFeedbackDraftText,
  answerError,
  answerPayload,
  checked,
  completeError,
  contentRef,
  currentDraftStatus,
  currentStep,
  currentStepIndex,
  isReady,
  isSubmitting,
  lesson,
  onAiFeedbackRequest,
  onAiFeedbackSkip,
  onAnswerPayloadChange,
  onCancelExit,
  onConfirmExit,
  onDraftFlush,
  onExit,
  onRetryDraft,
  onRetryLocalDraft,
  onSubmitCurrentStep,
  onUseServerDraft,
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
  readonly currentDraftStatus: LessonDraftSyncStatus
  readonly currentStep: LessonStep
  readonly currentStepIndex: number
  readonly isReady: boolean
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
  readonly onRetryDraft: () => void
  readonly onRetryLocalDraft: () => void
  readonly onSubmitCurrentStep: () => void
  readonly onUseServerDraft: () => void
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
          <StickyActionBar className="mx-auto max-w-2xl">
            <Button
              className="w-full"
              disabled={!isReady || isSubmitting}
              onClick={onSubmitCurrentStep}
              size="lg"
              variant={isReady ? "default" : "secondary"}
            >
              {isSubmitting ? "저장 중" : getLessonStepActionLabel(currentStep)}
            </Button>
          </StickyActionBar>
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
      <div className="an-fi" onBlurCapture={onDraftFlush}>
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
        {isDraftableLessonStep(currentStep) ? (
          <LessonDraftStatus
            onRetry={onRetryDraft}
            onRetryLocal={onRetryLocalDraft}
            onUseServer={onUseServerDraft}
            status={currentDraftStatus}
          />
        ) : null}
        {completeError === null || currentStep.type === "AI_FEEDBACK" ? null : (
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

function isDraftableLessonStep(step: LessonStep): boolean {
  return (
    step.type !== "AI_FEEDBACK" &&
    step.type !== "COMPARE" &&
    step.type !== "READING"
  )
}
