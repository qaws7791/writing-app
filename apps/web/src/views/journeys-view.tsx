"use client"

import { useState } from "react"
import { ToggleButton } from "@workspace/ui/components/toggle-button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useHomeSnapshot } from "@/features/home"
import { useJourneys } from "@/features/journeys"
import { JourneyCard } from "@/features/journeys/components"

const CATEGORY_LABEL: Record<
  "writing_skill" | "mindfulness" | "practical",
  string
> = {
  writing_skill: "글쓰기 역량",
  mindfulness: "자기 탐구",
  practical: "실용 글쓰기",
}

type Category = string

export default function JourneysView() {
  const {
    data: home,
    isPending: isHomePending,
    isError: isHomeError,
  } = useHomeSnapshot()
  const {
    data: completedJourneysData,
    isPending: isCompletedPending,
    isError: isCompletedError,
  } = useJourneys({ status: "completed" })
  const { data: allJourneysData, isPending: isAllPending } = useJourneys()
  const [selectedCategory, setSelectedCategory] = useState<Category>("전체")

  const activeJourneys =
    home?.activeJourneys.map((journey) => ({
      id: journey.journeyId,
      title: journey.title,
      description: `${journey.currentSessionOrder}번째 세션 진행 중`,
      progress: Math.round(journey.completionRate * 100),
      imageUrl:
        journey.thumbnailUrl ??
        `https://picsum.photos/seed/active-journey-${journey.journeyId}/600/400`,
    })) ?? []

  const completedJourneys =
    completedJourneysData?.items.map((journey) => ({
      id: journey.id,
      title: journey.title,
      description: journey.description,
      imageUrl:
        journey.thumbnailUrl ??
        `https://picsum.photos/seed/journey-${journey.id}/200/200`,
    })) ?? []

  const discoverJourneys =
    allJourneysData?.items.map((journey) => ({
      id: journey.id,
      title: journey.title,
      description: journey.description,
      sessionCount: journey.sessionCount,
      imageUrl:
        journey.thumbnailUrl ??
        `https://picsum.photos/seed/journey-card-${journey.id}/600/400`,
      category: CATEGORY_LABEL[journey.category],
    })) ?? []

  const categories = [
    "전체",
    ...Array.from(new Set(discoverJourneys.map((journey) => journey.category))),
  ]

  const filteredJourneys =
    selectedCategory === "전체"
      ? discoverJourneys
      : discoverJourneys.filter(
          (journey) => journey.category === selectedCategory
        )

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-headline-small-em text-on-surface">여정</h1>
      </div>

      {/* Active Journeys Section */}
      {(isHomePending || activeJourneys.length > 0) && (
        <section className="flex flex-col gap-4 px-4 pt-4">
          <h2 className="text-title-medium-em text-on-surface-low px-2">
            진행 중인 여정
          </h2>
          {isHomePending
            ? Array.from({ length: 2 }, (_, index) => (
                <Skeleton key={index} className="h-32 rounded-3xl" />
              ))
            : activeJourneys.map((journey) => (
                <JourneyCard key={journey.id} mode="active" {...journey} />
              ))}
          {isHomeError && (
            <div className="bg-surface-container text-body-medium text-on-surface-low rounded-3xl p-6 text-center">
              여정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
            </div>
          )}
        </section>
      )}

      {/* Completed Journeys Section */}
      {(isCompletedPending || completedJourneys.length > 0) && (
        <section className="flex flex-col gap-4 px-4 pt-8">
          <h2 className="text-title-medium-em text-on-surface-low px-2">
            완료한 여정
          </h2>
          {isCompletedPending
            ? Array.from({ length: 2 }, (_, index) => (
                <Skeleton key={index} className="h-24 rounded-3xl" />
              ))
            : completedJourneys.map((journey) => (
                <JourneyCard key={journey.id} mode="completed" {...journey} />
              ))}
          {isCompletedError && (
            <div className="bg-surface-container text-body-medium text-on-surface-low rounded-3xl p-6 text-center">
              완료한 여정을 불러오지 못했어요.
            </div>
          )}
        </section>
      )}

      {/* Discover Section */}
      <section className="flex flex-col pt-8">
        <h2 className="text-title-medium-em text-on-surface-low px-6">
          새 여정 시작하기
        </h2>

        {/* Category Filter Chips */}
        <div className="flex gap-2.5 overflow-x-auto px-4 py-4 [scrollbar-width:none]">
          {categories.map((cat) => (
            <ToggleButton
              key={cat}
              isSelected={selectedCategory === cat}
              onChange={() => setSelectedCategory(cat)}
              className="shrink-0"
            >
              {cat}
            </ToggleButton>
          ))}
        </div>

        {/* Journey Cards */}
        <div className="flex flex-col gap-4 px-4 pb-8">
          {isAllPending ? (
            Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-32 rounded-3xl" />
            ))
          ) : filteredJourneys.length === 0 ? (
            <div className="bg-surface-container text-body-medium text-on-surface-low rounded-3xl p-6">
              조건에 맞는 여정이 아직 없어요.
            </div>
          ) : (
            filteredJourneys.map((journey) => (
              <JourneyCard key={journey.id} mode="discover" {...journey} />
            ))
          )}
        </div>
      </section>
    </div>
  )
}
