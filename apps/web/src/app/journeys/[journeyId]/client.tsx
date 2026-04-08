"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import JourneyDetailView from "@/views/journey-detail-view"
import journeyData from "@/data/journey-sessions.json"

const JOURNEY_IMAGES = [
  "https://www.figma.com/api/mcp/asset/c6b65f07-a7d0-4a31-b8c7-1e75acfd3b0b",
  "https://www.figma.com/api/mcp/asset/089e5c17-97a0-4064-ac59-6f9bb2b74ef7",
]

const JOURNEY_DETAILS = Object.fromEntries(
  journeyData.journeys.map((j, i) => [
    j.id,
    {
      title: j.title,
      description: j.description,
      thumbnailUrl:
        JOURNEY_IMAGES[i % JOURNEY_IMAGES.length] ?? JOURNEY_IMAGES[0]!,
      sessions: j.sessions.map((s, si) => ({
        id: s.id,
        order: s.order,
        title: s.title,
        description: s.description,
        status: (si === 0 ? "IN_PROGRESS" : "LOCKED") as
          | "COMPLETED"
          | "IN_PROGRESS"
          | "LOCKED",
      })),
    },
  ])
)

export default function JourneyDetailClientPage({
  journeyId,
}: {
  journeyId: string
}) {
  const router = useRouter()
  const journey = JOURNEY_DETAILS[journeyId]

  useEffect(() => {
    if (!journey) {
      router.replace("/")
    }
  }, [journey, router])

  if (!journey) {
    return null
  }

  const completedCount = journey.sessions.filter(
    (s) => s.status === "COMPLETED"
  ).length

  return (
    <JourneyDetailView
      data={{
        id: journeyId,
        title: journey.title ?? "",
        description: journey.description,
        thumbnailUrl: journey.thumbnailUrl,
        completedCount,
        totalCount: journey.sessions.length,
        sessions: journey.sessions,
      }}
    />
  )
}
