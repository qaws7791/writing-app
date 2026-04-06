"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import SessionDetailView from "@/views/session-detail-view"
import type { Session } from "@/views/session-detail-view/types"
import journeyData from "@/data/journey-sessions.json"

export default function SessionDetailClientPage({
  journeyId,
  sessionId,
}: {
  journeyId: string
  sessionId: string
}) {
  const router = useRouter()
  const journey = journeyData.journeys.find((j) => j.id === journeyId)
  const session = journey?.sessions.find((s) => s.id === sessionId)
  const invalid = !journey || !session || session.steps.length === 0

  useEffect(() => {
    if (invalid) {
      router.replace(`/journeys/${journeyId}`)
    }
  }, [invalid, journeyId, router])

  if (invalid) {
    return null
  }

  return (
    <SessionDetailView
      journeyTitle={journey.title}
      session={session as unknown as Session}
      onExit={() => router.push(`/journeys/${journeyId}`)}
    />
  )
}
