"use client"

import { useRouter } from "next/navigation"
import { useHomeSnapshot } from "@/features/home"
import { JourneyCard } from "@/features/journeys/components"
import {
  GreetingSection,
  WritingSuggestionCard,
} from "@/features/home/components"

function JourneyCardSkeleton() {
  return (
    <div className="flex h-32 w-full animate-pulse items-center gap-5 rounded-3xl bg-surface-container p-4">
      <div className="size-24 shrink-0 rounded-[32px] bg-surface-container-high" />
      <div className="flex h-[87.5px] flex-1 flex-col gap-2">
        <div className="h-4 w-3/4 rounded bg-surface-container-high" />
        <div className="h-3 w-1/2 rounded bg-surface-container-high" />
      </div>
    </div>
  )
}

export default function HomeView() {
  const router = useRouter()
  const { data, isPending, isError } = useHomeSnapshot()

  const activeJourneys = data?.activeJourneys ?? []
  const showStartJourneyCta = data?.showStartJourneyCta ?? false

  return (
    <>
      {/* Header */}
      <header className="px-6 py-6">
        <h1 className="text-headline-small-em text-on-surface">홈</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Greeting */}
        <GreetingSection />

        {/* Writing Suggestion Card */}
        {data?.showWritingSuggestion && <WritingSuggestionCard />}

        {/* Active Journeys Section */}
        <div className="mt-8 flex flex-col gap-6 px-4 pb-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-title-medium-em text-on-surface-low">
              현재 진행 중인 여정
            </h3>
            <button
              className="text-label-large-em text-on-surface-low"
              onClick={() => router.push("/journeys")}
            >
              더보기
            </button>
          </div>
          <div className="flex flex-col gap-6">
            {isPending ? (
              <>
                <JourneyCardSkeleton />
                <JourneyCardSkeleton />
              </>
            ) : isError ? (
              <p className="px-2 text-body-medium text-on-surface-low">
                여정 정보를 불러올 수 없어요
              </p>
            ) : activeJourneys.length === 0 ? (
              showStartJourneyCta ? (
                <button
                  type="button"
                  onClick={() => router.push("/journeys")}
                  className="flex flex-col items-center gap-3 rounded-3xl bg-surface-container p-8 transition-colors hover:bg-surface-container-high"
                >
                  <p className="text-title-medium-em text-on-surface">
                    첫 여정을 시작해보세요
                  </p>
                  <p className="text-body-medium text-on-surface-low">
                    나에게 맞는 여정을 찾아 글쓰기 실력을 키워보세요
                  </p>
                </button>
              ) : (
                <p className="px-2 text-body-medium text-on-surface-low">
                  진행 중인 여정이 없어요
                </p>
              )
            ) : (
              activeJourneys.map((journey) => (
                <JourneyCard
                  key={journey.journeyId}
                  mode="active"
                  id={journey.journeyId}
                  imageUrl={
                    journey.thumbnailUrl ??
                    `https://picsum.photos/seed/active-journey-${journey.journeyId}/600/400`
                  }
                  title={journey.title}
                  description={journey.description}
                  progress={Math.round(journey.completionRate * 100)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
