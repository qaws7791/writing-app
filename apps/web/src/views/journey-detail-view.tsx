"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import {
  JourneyHero,
  JourneyProgressCard,
  SessionCard,
} from "@/features/journeys/components"
import type { SessionItem } from "@/features/journeys/components"

interface JourneyDetailData {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  completedCount: number
  totalCount: number
  sessions: SessionItem[]
}

export default function JourneyDetailView({
  data,
  onStartSession,
}: {
  data: JourneyDetailData
  onStartSession?: (sessionId: string) => void | Promise<void>
}) {
  const router = useRouter()

  function handleStartSession(sessionId: string) {
    if (onStartSession) {
      void onStartSession(sessionId)
      return
    }

    router.push(`/journeys/${data.id}/sessions/${sessionId}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3">
        <Button
          isIconOnly
          variant="ghost"
          aria-label="뒤로 가기"
          onPress={() => router.back()}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </Button>
        <span className="flex-1 truncate px-2 text-center text-sm leading-5 font-medium text-foreground">
          {data.title}
        </span>
        <Button isIconOnly variant="ghost" aria-label="더보기">
          <HugeiconsIcon
            icon={MoreHorizontalIcon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </Button>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <JourneyHero
          thumbnailUrl={data.thumbnailUrl}
          title={data.title}
          description={data.description}
        />

        <JourneyProgressCard
          completedCount={data.completedCount}
          totalCount={data.totalCount}
        />

        {/* Session List */}
        <div className="flex flex-col gap-5 px-4 pt-6 pb-4">
          {data.sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onStart={handleStartSession}
            />
          ))}
        </div>

        {/* Writing CTA after journey completion */}
        {data.completedCount === data.totalCount && data.totalCount > 0 && (
          <div className="px-4 pb-8">
            <Button
              variant="secondary"
              className="flex h-auto w-full flex-col gap-2 rounded-3xl p-6 text-left"
              onPress={() => router.push("/writings/new")}
            >
              <p className="text-lg leading-7 font-semibold text-foreground">
                글쓰기 공간에서 배운 내용을 표현해보세요
              </p>
              <p className="text-sm leading-6 text-muted">
                여정에서 배운 내용을 자유롭게 글로 써보세요
              </p>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
