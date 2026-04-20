"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type { Session, StepState } from "@/views/session-detail-view/types"
import { getStepCta } from "@/views/session-detail-view/step-registry"
import { StepRenderer } from "@/views/session-detail-view/step-renderer"
import { SessionHeader, SessionCtaBar } from "@/features/sessions/components"

interface SessionDetailViewProps {
  initialCurrentStepOrder?: number
  initialStepStates?: Record<string, StepState>
  isRetryingAi?: boolean
  journeyTitle: string
  onRetryAi?: (stepOrder: number) => Promise<void>
  session: Session
  onExit: () => void
  onSubmitStep?: (stepOrder: number, response: StepState) => Promise<void>
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
  const currentStep = steps[currentStepIndex] ?? steps[0]
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
    return getStepCta({
      handleNext,
      isSubmitting,
      state: getStepState(currentStep.id),
      step: currentStep,
      updateState: (state) => updateStepState(currentStep.id, state),
    })
  }, [currentStep, getStepState, handleNext, isSubmitting, updateStepState])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SessionHeader
        journeyTitle={journeyTitle}
        progress={progress}
        onBack={currentStepIndex > 0 ? handleBack : onExit}
        onExit={onExit}
      />

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

      <SessionCtaBar
        label={ctaState.label}
        enabled={ctaState.enabled}
        isSubmitting={isSubmitting}
        onClick={ctaState.action}
      />
    </div>
  )
}
