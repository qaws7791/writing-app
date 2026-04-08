"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"

import { useJourneyDetail } from "@/features/journeys"
import {
  fetchSessionDetail,
  useCompleteSession,
  useRetrySessionStepAi,
  useSessionDetail,
  useStartSession,
  useSubmitSessionStep,
} from "@/features/sessions"
import SessionDetailView from "@/views/session-detail-view"
import type {
  Session,
  SessionAiStepState,
  Step,
  StepContent,
  StepState,
  StepType,
} from "@/views/session-detail-view/types"

type SessionRuntime = Awaited<ReturnType<typeof fetchSessionDetail>>

const FALLBACK_STEP_TYPE: Record<string, StepType> = {
  learn: "CONCEPT",
  read: "EXAMPLE",
  guided_question: "MULTIPLE_CHOICE",
  write: "WRITING",
  feedback: "AI_FEEDBACK",
  revise: "REWRITING",
}

function mapSessionStep(step: {
  order: number
  type: string
  contentJson?: unknown
}): Step {
  const payload = (step.contentJson ?? {}) as {
    cta?: { label?: string; variant?: "primary" | "secondary" }
    content?: StepContent
    type?: StepType
  }

  const type = payload.type ?? FALLBACK_STEP_TYPE[step.type] ?? "CONCEPT"

  return {
    id: String(step.order),
    type,
    order: step.order,
    content: payload.content as StepContent,
    cta: {
      label: payload.cta?.label ?? "다음",
      variant: payload.cta?.variant === "secondary" ? "secondary" : "primary",
    },
  }
}

function mapStepStates(
  runtime: SessionRuntime | undefined
): Record<string, StepState> {
  if (!runtime) {
    return {}
  }

  const stepStates = Object.fromEntries(
    Object.entries(runtime.stepResponsesJson).map(([stepId, response]) => [
      stepId,
      response as StepState,
    ])
  )

  for (const aiState of runtime.stepAiStates) {
    stepStates[String(aiState.stepOrder)] = aiState as SessionAiStepState
  }

  return stepStates
}

export default function SessionDetailClientPage({
  journeyId,
  sessionId,
}: {
  journeyId: string
  sessionId: string
}) {
  const router = useRouter()
  const journeyIdNumber = Number(journeyId)
  const sessionIdNumber = Number(sessionId)
  const journeyQuery = useJourneyDetail(journeyIdNumber)
  const sessionQuery = useSessionDetail(sessionIdNumber)
  const startSession = useStartSession()
  const retrySessionStepAi = useRetrySessionStepAi()
  const submitSessionStep = useSubmitSessionStep()
  const completeSession = useCompleteSession()

  const journey = journeyQuery.data
  const sessionRuntime = sessionQuery.data

  const invalid =
    !Number.isFinite(journeyIdNumber) ||
    !Number.isFinite(sessionIdNumber) ||
    journeyIdNumber <= 0 ||
    sessionIdNumber <= 0

  useEffect(() => {
    if (invalid) {
      router.replace(`/journeys/${journeyId}`)
    }
  }, [invalid, journeyId, router])

  useEffect(() => {
    if (!sessionRuntime || startSession.isPending || startSession.isSuccess) {
      return
    }

    void startSession.mutateAsync(sessionRuntime.id)
  }, [sessionRuntime, startSession])

  const initialStepStates = useMemo(
    () => mapStepStates(sessionRuntime),
    [sessionRuntime]
  )

  if (invalid) {
    return null
  }

  if (
    journeyQuery.isPending ||
    sessionQuery.isPending ||
    !sessionRuntime ||
    !journey
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6 text-sm text-on-surface-low">
        세션을 준비하고 있어요...
      </div>
    )
  }

  const journeyDetail = journey
  const sessionDetail = sessionRuntime
  const mappedSession: Session = {
    id: String(sessionDetail.id),
    order: sessionDetail.order,
    title: sessionDetail.title,
    description: sessionDetail.description,
    steps: sessionDetail.steps.map(mapSessionStep),
  }

  if (
    journeyQuery.isError ||
    sessionQuery.isError ||
    mappedSession.steps.length === 0
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <p className="text-sm text-on-surface-low">
          세션 정보를 불러오지 못했어요.
        </p>
        <button
          onClick={() => router.push(`/journeys/${journeyId}`)}
          className="rounded-full bg-on-surface px-5 py-3 text-sm font-semibold text-surface"
        >
          여정으로 돌아가기
        </button>
      </div>
    )
  }

  async function handleSubmitStep(stepOrder: number, response: unknown) {
    await submitSessionStep.mutateAsync({
      sessionId: sessionDetail.id,
      stepOrder,
      response,
    })
  }

  async function handleRetryAi(stepOrder: number) {
    await retrySessionStepAi.mutateAsync({
      sessionId: sessionDetail.id,
      stepOrder,
    })
  }

  async function handleCompleteSession() {
    await completeSession.mutateAsync({
      sessionId: sessionDetail.id,
      journeyId: journeyDetail.id,
      nextSessionOrder: sessionDetail.order + 1,
      totalSessions: journeyDetail.sessions.length,
    })
  }

  return (
    <SessionDetailView
      initialCurrentStepOrder={sessionDetail.currentStepOrder}
      initialStepStates={initialStepStates}
      isRetryingAi={retrySessionStepAi.isPending}
      journeyTitle={journeyDetail.title}
      onCompleteSession={handleCompleteSession}
      onExit={() => router.push(`/journeys/${journeyId}`)}
      onRetryAi={handleRetryAi}
      onSubmitStep={handleSubmitStep}
      session={mappedSession}
    />
  )
}
