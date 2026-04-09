"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useEnrollJourney, useJourneyDetail } from "@/features/journeys"
import JourneyDetailView from "@/views/journey-detail-view"

export default function JourneyDetailClientPage({
  journeyId,
}: {
  journeyId: string
}) {
  const router = useRouter()
  const journeyIdNumber = Number(journeyId)
  const {
    data: journey,
    isPending,
    isError,
  } = useJourneyDetail(journeyIdNumber)
  const enrollJourney = useEnrollJourney()

  useEffect(() => {
    if (!Number.isFinite(journeyIdNumber) || journeyIdNumber <= 0) {
      router.replace("/")
    }
  }, [journeyIdNumber, router])

  if (!Number.isFinite(journeyIdNumber) || journeyIdNumber <= 0) {
    return null
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6 text-sm text-on-surface-low">
        여정을 불러오고 있어요...
      </div>
    )
  }

  if (isError || !journey) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <p className="text-sm text-on-surface-low">
          여정 정보를 불러오지 못했어요.
        </p>
        <button
          onClick={() => router.push("/home?tab=journeys")}
          className="rounded-full bg-on-surface px-5 py-3 text-sm font-semibold text-surface"
        >
          여정 목록으로 돌아가기
        </button>
      </div>
    )
  }

  const progress = journey.progress
  const currentSessionOrder = progress?.currentSessionOrder ?? 1
  const completedCount = progress ? Math.max(0, currentSessionOrder - 1) : 0

  async function handleStartSession(sessionId: string) {
    if (!progress) {
      await enrollJourney.mutateAsync(journey!.id)
    }

    router.push(`/journeys/${journey!.id}/sessions/${sessionId}`)
  }

  return (
    <JourneyDetailView
      data={{
        id: String(journey.id),
        title: journey.title,
        description: journey.description,
        thumbnailUrl:
          journey.thumbnailUrl ??
          `https://picsum.photos/seed/journey-detail-${journey.id}/800/600`,
        completedCount,
        totalCount: journey.sessions.length,
        sessions: journey.sessions.map((session) => ({
          id: String(session.id),
          order: session.order,
          title: session.title,
          description: session.description,
          status:
            session.order < currentSessionOrder
              ? "COMPLETED"
              : session.order === currentSessionOrder
                ? "IN_PROGRESS"
                : "LOCKED",
        })),
      }}
      onStartSession={handleStartSession}
    />
  )
}
