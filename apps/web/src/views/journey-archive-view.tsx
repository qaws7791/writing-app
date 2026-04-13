"use client"

import { useState } from "react"

import { ToggleButton } from "@workspace/ui/components/toggle-button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useJourneys } from "@/features/journeys"
import { JourneyCard } from "@/features/journeys/components/journey-card"

const CATEGORY_LABEL: Record<
  "writing_skill" | "mindfulness" | "practical",
  string
> = {
  writing_skill: "글쓰기 역량",
  mindfulness: "자기 탐구",
  practical: "실용 글쓰기",
}

type Category = string

interface JourneyCardData {
  id: number
  title: string
  description: string
  sessionCount: number
  imageUrl: string
  category: string
}

export default function JourneyArchiveView() {
  const { data, isPending, isError } = useJourneys()
  const [selectedCategory, setSelectedCategory] = useState<Category>("전체")

  const journeyCards: JourneyCardData[] =
    data?.items.map((journey) => ({
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
    ...Array.from(new Set(journeyCards.map((journey) => journey.category))),
  ]

  const filteredJourneys =
    selectedCategory === "전체"
      ? journeyCards
      : journeyCards.filter((journey) => journey.category === selectedCategory)

  return (
    <div className="flex flex-col">
      {/* Category Filter Chips */}
      <div className="flex gap-2.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]">
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
      <div className="flex flex-col gap-4 px-4 pt-6 pb-8">
        {isPending
          ? Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-32 rounded-3xl" />
            ))
          : null}

        {isError ? (
          <div className="rounded-3xl bg-surface-secondary p-6 text-sm leading-6 text-muted">
            여정 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </div>
        ) : null}

        {!isPending && !isError && filteredJourneys.length === 0 ? (
          <div className="rounded-3xl bg-surface-secondary p-6 text-sm leading-6 text-muted">
            조건에 맞는 여정이 아직 없어요.
          </div>
        ) : null}

        {!isPending && !isError
          ? filteredJourneys.map((journey) => (
              <JourneyCard key={journey.id} mode="discover" {...journey} />
            ))
          : null}
      </div>
    </div>
  )
}
