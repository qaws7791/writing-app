"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useHomeSnapshot } from "@/features/home"
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
  const { data: home } = useHomeSnapshot()
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

  const journeyDetail = journey

  const activeJourney = home?.activeJourneys.find(
    (item) => item.journeyId === journeyDetail.id
  )
  const currentSessionOrder = activeJourney?.currentSessionOrder ?? 1
  const completedCount = activeJourney
    ? Math.max(0, currentSessionOrder - 1)
    : 0

  async function handleStartSession(sessionId: string) {
    if (!activeJourney) {
      await enrollJourney.mutateAsync(journeyDetail.id)
    }

    router.push(`/journeys/${journeyDetail.id}/sessions/${sessionId}`)
  }

  return (
    <JourneyDetailView
      data={{
        id: String(journeyDetail.id),
        title: journeyDetail.title,
        description: journeyDetail.description,
        thumbnailUrl:
          journeyDetail.thumbnailUrl ??
          `https://picsum.photos/seed/journey-detail-${journeyDetail.id}/800/600`,
        completedCount,
        totalCount: journeyDetail.sessions.length,
        sessions: journeyDetail.sessions.map((session) => ({
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
