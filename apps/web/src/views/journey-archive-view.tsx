"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Layers01Icon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { ToggleButton } from "@workspace/ui/components/toggle-button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useJourneys } from "@/features/journeys"

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

function JourneyListCard({ card }: { card: JourneyCardData }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/journeys/${card.id}`)}
      className="bg-surface-container hover:bg-surface-container-high flex h-32 w-full items-center gap-5 rounded-3xl p-4 text-left transition-colors"
    >
      <div className="bg-surface-container-high size-24 shrink-0 overflow-hidden rounded-[18px]">
        <img
          src={card.imageUrl}
          alt={card.title}
          className="size-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
        <div className="flex flex-col gap-1">
          <p className="text-title-medium text-on-surface">{card.title}</p>
          <p className="text-body-medium text-on-surface-low line-clamp-2">
            {card.description}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <HugeiconsIcon
            icon={Layers01Icon}
            size={12}
            color="currentColor"
            strokeWidth={1.5}
            className="text-on-surface-low"
          />
          <span className="text-label-small text-on-surface-low uppercase">
            {card.sessionCount}개의 세션
          </span>
        </div>
      </div>
    </button>
  )
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
          <div className="bg-surface-container text-body-medium text-on-surface-low rounded-3xl p-6">
            여정 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </div>
        ) : null}

        {!isPending && !isError && filteredJourneys.length === 0 ? (
          <div className="bg-surface-container text-body-medium text-on-surface-low rounded-3xl p-6">
            조건에 맞는 여정이 아직 없어요.
          </div>
        ) : null}

        {!isPending && !isError
          ? filteredJourneys.map((journey) => (
              <JourneyListCard key={journey.id} card={journey} />
            ))
          : null}
      </div>
    </div>
  )
}
