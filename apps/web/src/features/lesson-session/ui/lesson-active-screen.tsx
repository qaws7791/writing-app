"use client"

import type { Ref } from "react"

import type { LessonStepAnswerPayload } from "@/features/lesson-session/model/lesson-logic"
import type { LessonStepCheckedState } from "@/features/lesson-session/model/lesson-step-policy"
import {
  getLessonStepActionLabel,
  getLessonStepPendingLabel,
} from "@/features/lesson-session/model/lesson-step-policy"
import { LessonStepRenderer } from "@/features/lesson-session/ui/lesson-step-renderer"
import type {
  LearnerLesson,
  LearnerLessonStep,
} from "@workspace/contracts/learning/learner-content"
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
import { Spinner } from "@workspace/ui/components/primitives/spinner"

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
  onSubmitCurrentStep,
  progress,
  renderRevision,
  sessionBootstrap,
  showExit,
  visibleStepNumber,
}: {
  readonly answerError: null | string
  readonly answerPayload: LessonStepAnswerPayload | undefined
  readonly checked: LessonCheckedState
  readonly completeError: null | string
  readonly contentRef: Ref<HTMLElement>
  readonly currentStep: LearnerLessonStep
  readonly currentStepIndex: number
  readonly exitError: null | string
  readonly isReady: boolean
  readonly isLeaving: boolean
  readonly isSubmitting: boolean
  readonly lesson: LearnerLesson
  readonly onAnswerPayloadChange: (change: {
    readonly payload: LessonStepAnswerPayload
    readonly stepId: string
  }) => void
  readonly onCancelExit: () => void
  readonly onConfirmExit: () => void
  readonly onContinueLessonStep: () => void
  readonly onDraftFlush: () => void
  readonly onExit: () => void
  readonly onSubmitCurrentStep: () => void
  readonly progress: number
  readonly renderRevision: number
  readonly sessionBootstrap?:
    | {
        readonly error: null | string
        readonly isStarting: boolean
        readonly onRetry: () => void
      }
    | undefined
  readonly showExit: boolean
  readonly visibleStepNumber: number
}) {
  const isBootstrapping = sessionBootstrap !== undefined
  const canInteract = !isBootstrapping

  return (
    <LessonShell
      contentRef={contentRef}
      footer={
        checked === false ? (
          <LessonFooter aria-label="레슨 행동">
            <LessonActions>
              {isBootstrapping && sessionBootstrap.error !== null ? (
                <Button
                  disabled={sessionBootstrap.isStarting}
                  onClick={sessionBootstrap.onRetry}
                  size="lg"
                >
                  {sessionBootstrap.isStarting ? (
                    <>
                      <Spinner aria-hidden data-icon="inline-start" />
                      시작하는 중…
                    </>
                  ) : (
                    "다시 시도"
                  )}
                </Button>
              ) : (
                <Button
                  aria-busy={
                    isBootstrapping && sessionBootstrap.isStarting
                      ? true
                      : undefined
                  }
                  disabled={
                    isBootstrapping
                      ? sessionBootstrap.isStarting
                      : !isReady || isSubmitting
                  }
                  onClick={onSubmitCurrentStep}
                  size="lg"
                  variant={
                    isBootstrapping || !isReady ? "secondary" : "default"
                  }
                >
                  {isBootstrapping && sessionBootstrap.isStarting ? (
                    <>
                      <Spinner aria-hidden data-icon="inline-start" />
                      시작하는 중…
                    </>
                  ) : isSubmitting ? (
                    getLessonStepPendingLabel(currentStep)
                  ) : (
                    getLessonStepActionLabel(currentStep)
                  )}
                </Button>
              )}
            </LessonActions>
          </LessonFooter>
        ) : (
          <LessonCheckedFooter
            checked={checked}
            isSubmitting={isSubmitting}
            onContinue={onContinueLessonStep}
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
      <div
        className="flex flex-col gap-4"
        onBlurCapture={canInteract ? onDraftFlush : undefined}
      >
        <LessonStepRenderer
          answerError={answerError}
          checked={checked}
          onAnswerPayloadChange={
            canInteract ? onAnswerPayloadChange : () => undefined
          }
          key={`${currentStepIndex}:${renderRevision}`}
          step={currentStep}
          {...(answerPayload === undefined ? {} : { answerPayload })}
        />
        {sessionBootstrap?.error === null ||
        sessionBootstrap?.error === undefined ? null : (
          <Insight role="alert" tone="incorrect">
            <InsightEyebrow>레슨을 시작하지 못했어요</InsightEyebrow>
            <InsightDescription>{sessionBootstrap.error}</InsightDescription>
          </Insight>
        )}
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
