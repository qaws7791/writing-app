"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useJourneyDetail } from "@/features/journeys"
import { useSessionDetail } from "@/features/sessions"
import SessionDetailView from "@/views/session-detail-view/session-detail-view"

import { mapSession } from "./session-mappers"
import { useSessionRunner } from "./use-session-runner"

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

  const journey = journeyQuery.data
  const sessionRuntime = sessionQuery.data
  const session = mapSession(sessionRuntime)

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

  const sessionRunner = useSessionRunner({
    session: sessionRuntime,
    steps: session?.steps ?? [],
  })

  if (invalid) {
    return null
  }

  if (journeyQuery.isError || sessionQuery.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">
          세션 정보를 불러오지 못했어요.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/journeys/${journeyId}`)}
          className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background"
        >
          여정으로 돌아가기
        </button>
      </div>
    )
  }

  if (
    journeyQuery.isPending ||
    sessionQuery.isPending ||
    !sessionRuntime ||
    !journey
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-sm text-muted-foreground">
        세션을 준비하고 있어요...
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">
          아직 준비 중인 세션이에요.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/journeys/${journeyId}`)}
          className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background"
        >
          여정으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <SessionDetailView
      initialCurrentStepOrder={sessionRuntime.currentStepOrder}
      initialStepStates={sessionRunner.initialStepStates}
      isRetryingAi={sessionRunner.isRetryingAi}
      journeyTitle={journey.title}
      onExit={() => router.push(`/journeys/${journeyId}`)}
      onRetryAi={sessionRunner.handleRetryAi}
      onSubmitStep={sessionRunner.handleSubmitStep}
      session={session}
    />
  )
}
