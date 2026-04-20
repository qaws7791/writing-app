"use client"

import { useEffect, useMemo } from "react"

import {
  serializeStepResponse,
  useRetrySessionStepAi,
  useStartSession,
  useSubmitSessionStep,
} from "@/features/sessions"
import type { Step, StepState } from "@/views/session-detail-view/types"

import { mapStepStates, type SessionRuntime } from "./session-mappers"

export function useSessionRunner(input: {
  session: SessionRuntime | undefined
  steps: Step[]
}) {
  const startSession = useStartSession()
  const retrySessionStepAi = useRetrySessionStepAi()
  const submitSessionStep = useSubmitSessionStep()

  useEffect(() => {
    if (!input.session || startSession.isPending || startSession.isSuccess) {
      return
    }

    void startSession.mutateAsync(input.session.id)
  }, [input.session, startSession])

  const initialStepStates = useMemo(
    () => mapStepStates(input.session),
    [input.session]
  )

  async function handleSubmitStep(stepOrder: number, response: StepState) {
    if (!input.session) {
      return
    }

    const step = input.steps.find((item) => item.order === stepOrder)

    await submitSessionStep.mutateAsync({
      sessionId: input.session.id,
      stepOrder,
      response:
        step === undefined ? undefined : serializeStepResponse(step, response),
    })
  }

  async function handleRetryAi(stepOrder: number) {
    if (!input.session) {
      return
    }

    await retrySessionStepAi.mutateAsync({
      sessionId: input.session.id,
      stepOrder,
    })
  }

  return {
    initialStepStates,
    isRetryingAi: retrySessionStepAi.isPending,
    handleRetryAi,
    handleSubmitStep,
  }
}
