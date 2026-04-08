"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Layers01Icon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import journeyData from "@/data/journey-sessions.json"

const JOURNEY_IMAGES = [
  "https://www.figma.com/api/mcp/asset/c6b65f07-a7d0-4a31-b8c7-1e75acfd3b0b",
  "https://www.figma.com/api/mcp/asset/089e5c17-97a0-4064-ac59-6f9bb2b74ef7",
]

const ALL_CATEGORIES = Array.from(
  new Set(journeyData.journeys.map((j) => j.category))
)
const CATEGORIES = ["전체", ...ALL_CATEGORIES] as const
type Category = string

interface JourneyCardData {
  id: string
  title: string
  description: string
  sessionCount: number
  imageUrl: string
  category: string
}

const JOURNEY_CARDS: JourneyCardData[] = journeyData.journeys.map((j, i) => ({
  id: j.id,
  title: j.title,
  description: j.description,
  sessionCount: j.sessions.length,
  imageUrl: JOURNEY_IMAGES[i % JOURNEY_IMAGES.length] ?? JOURNEY_IMAGES[0]!,
  category: j.category,
}))

function JourneyListCard({ card }: { card: JourneyCardData }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/journeys/${card.id}`)}
      className="flex h-32 w-full items-center gap-5 rounded-3xl bg-surface-container p-4 text-left transition-colors hover:bg-surface-container-high"
    >
      <div className="size-24 shrink-0 overflow-hidden rounded-[18px] bg-surface-container-high">
        <img
          src={card.imageUrl}
          alt={card.title}
          className="size-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
        <div className="flex flex-col gap-1">
          <p className="text-lg leading-6 font-semibold text-on-surface">
            {card.title}
          </p>
          <p className="line-clamp-2 text-sm leading-4 font-medium text-on-surface-low">
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
          <span className="text-[11px] font-medium tracking-[0.016rem] text-on-surface-low uppercase">
            {card.sessionCount}개의 세션
          </span>
        </div>
      </div>
    </button>
  )
}

export default function JourneyArchiveView() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("전체")

  const filteredJourneys =
    selectedCategory === "전체"
      ? JOURNEY_CARDS
      : JOURNEY_CARDS.filter((j) => j.category === selectedCategory)

  return (
    <div className="flex flex-col">
      {/* Category Filter Chips */}
      <div className="flex gap-2.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-primary text-on-primary"
                : "bg-secondary-container text-on-surface-low"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Journey Cards */}
      <div className="flex flex-col gap-4 px-4 pt-6 pb-8">
        {filteredJourneys.map((journey) => (
          <JourneyListCard key={journey.id} card={journey} />
        ))}
      </div>
    </div>
  )
}
