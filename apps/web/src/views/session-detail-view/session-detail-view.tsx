"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

import type {
  Session,
  SessionAiStepState,
  StepState,
  StepType,
} from "@/views/session-detail-view/types"
import { StepRenderer } from "@/views/session-detail-view/step-renderer"

interface SessionDetailViewProps {
  initialCurrentStepOrder?: number
  initialStepStates?: Record<string, StepState>
  isRetryingAi?: boolean
  journeyTitle: string
  onRetryAi?: (stepOrder: number) => Promise<void>
  session: Session
  onExit: () => void
  onSubmitStep?: (stepOrder: number, response: unknown) => Promise<void>
}

const SELECTION_TYPES: StepType[] = [
  "MULTIPLE_CHOICE",
  "FILL_IN_THE_BLANK",
  "ORDERING",
  "HIGHLIGHT",
]

const AI_TYPES: StepType[] = ["AI_FEEDBACK", "AI_COMPARISON"]
const INPUT_TYPES: StepType[] = ["WRITING", "SHORT_ANSWER", "REWRITING"]

function isSessionAiStepState(value: StepState): value is SessionAiStepState {
  return (
    value !== undefined &&
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "kind" in value
  )
}

export default function SessionDetailView({
  initialCurrentStepOrder = 1,
  initialStepStates = {},
  isRetryingAi = false,
  journeyTitle,
  onRetryAi,
  session,
  onExit,
  onSubmitStep,
}: SessionDetailViewProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(
    Math.max(0, initialCurrentStepOrder - 1)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stepStates, setStepStates] =
    useState<Record<string, StepState>>(initialStepStates)

  const steps = session.steps
  const currentStep = steps[currentStepIndex]!
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  useEffect(() => {
    setCurrentStepIndex(
      Math.min(Math.max(0, initialCurrentStepOrder - 1), steps.length - 1)
    )
  }, [initialCurrentStepOrder, steps.length])

  useEffect(() => {
    setStepStates(initialStepStates)
  }, [initialStepStates])

  const updateStepState = useCallback((stepId: string, state: StepState) => {
    setStepStates((prev) => ({ ...prev, [stepId]: state }))
  }, [])

  const getStepState = useCallback(
    (stepId: string) => stepStates[stepId],
    [stepStates]
  )

  const handleNext = useCallback(async () => {
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmitStep?.(currentStep.order, stepStates[currentStep.id])

      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((i) => i + 1)
        return
      }

      onExit()
    } finally {
      setIsSubmitting(false)
    }
  }, [
    currentStep.id,
    currentStep.order,
    currentStepIndex,
    isSubmitting,
    onExit,
    onSubmitStep,
    stepStates,
    steps.length,
  ])

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1)
    }
  }, [currentStepIndex])

  const ctaState = useMemo(() => {
    const state = getStepState(currentStep.id)
    const stateFlags =
      typeof state === "object" && state !== null
        ? (state as {
            checked?: boolean
            hasSelection?: boolean
            hasInput?: boolean
          })
        : undefined
    const isChecked = stateFlags?.checked === true

    if (SELECTION_TYPES.includes(currentStep.type)) {
      if (isChecked) {
        return { label: "다음", enabled: true, action: handleNext }
      }
      const hasSelection = stateFlags?.hasSelection === true
      return {
        label: currentStep.cta.label,
        enabled: hasSelection && !isSubmitting,
        action: () =>
          updateStepState(currentStep.id, {
            ...stateFlags,
            checked: true,
          } as StepState),
      }
    }

    if (INPUT_TYPES.includes(currentStep.type)) {
      const hasInput = stateFlags?.hasInput === true
      return {
        label: currentStep.cta.label,
        enabled: hasInput && !isSubmitting,
        action: handleNext,
      }
    }

    if (AI_TYPES.includes(currentStep.type)) {
      const aiState = isSessionAiStepState(state) ? state : undefined

      return {
        label: currentStep.cta.label,
        enabled: aiState?.status === "succeeded" && !isSubmitting,
        action: handleNext,
      }
    }

    return {
      label: currentStep.cta.label,
      enabled: !isSubmitting,
      action: handleNext,
    }
  }, [currentStep, getStepState, handleNext, isSubmitting, updateStepState])

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 flex flex-col bg-surface/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            aria-label="나가기"
            onClick={currentStepIndex > 0 ? handleBack : onExit}
            className="flex size-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              color="currentColor"
              strokeWidth={1.5}
            />
          </button>
          <span className="flex-1 truncate px-2 text-center text-sm font-medium text-on-surface-low">
            {journeyTitle}
          </span>
          <button
            aria-label="닫기"
            onClick={onExit}
            className="flex size-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={20}
              color="currentColor"
              strokeWidth={1.5}
            />
          </button>
        </div>
        {/* Progress bar */}
        <div className="h-1 w-full bg-surface-container-high">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32">
        <StepRenderer
          isRetryingAi={isRetryingAi}
          onRetryAi={onRetryAi}
          sessionId={session.id}
          step={currentStep}
          stepState={getStepState(currentStep.id)}
          onStateChange={(state) => updateStepState(currentStep.id, state)}
          allStepStates={stepStates}
          steps={steps}
        />
      </div>

      {/* CTA */}
      <div className="fixed right-0 bottom-0 left-0 z-50 bg-linear-to-t from-surface via-surface to-transparent px-5 pt-6 safe-area-pb">
        <button
          onClick={ctaState.action}
          disabled={!ctaState.enabled || isSubmitting}
          className="w-full rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-on-primary transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
        >
          {isSubmitting ? "저장 중..." : ctaState.label}
        </button>
      </div>
    </div>
  )
}
