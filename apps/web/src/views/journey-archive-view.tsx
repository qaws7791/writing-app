"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Layers01Icon } from "@hugeicons/core-free-icons"

const JOURNEY_IMAGE_1 =
  "https://www.figma.com/api/mcp/asset/c6b65f07-a7d0-4a31-b8c7-1e75acfd3b0b"
const JOURNEY_IMAGE_2 =
  "https://www.figma.com/api/mcp/asset/089e5c17-97a0-4064-ac59-6f9bb2b74ef7"

const CATEGORIES = ["전체", "글쓰기 기술", "마음챙김", "기술"] as const
type Category = (typeof CATEGORIES)[number]

interface JourneyCardData {
  id: string
  title: string
  description: string
  sessionCount: number
  imageUrl: string
  category: Exclude<Category, "전체">
}

const JOURNEY_CARDS: JourneyCardData[] = [
  {
    id: "1",
    title: "새벽의 대화",
    description: "완성된 단편선",
    sessionCount: 11,
    imageUrl: JOURNEY_IMAGE_1,
    category: "글쓰기 기술",
  },
  {
    id: "2",
    title: "나를 찾는 여행",
    description:
      "자아 성찰 에세이 자아 성찰 에세이 자아 성찰 에세이 자아 성찰 에세이 자아 성찰 에세이",
    sessionCount: 11,
    imageUrl: JOURNEY_IMAGE_2,
    category: "마음챙김",
  },
  {
    id: "3",
    title: "나를 찾는 여행",
    description:
      "자아 성찰 에세이 자아 성찰 에세이 자아 성찰 에세이 자아 성찰 에세이 자아 성찰 에세이",
    sessionCount: 11,
    imageUrl: JOURNEY_IMAGE_2,
    category: "기술",
  },
  {
    id: "4",
    title: "나를 찾는 여행",
    description:
      "자아 성찰 에세이 자아 성찰 에세이 자아 성찰 에세이 자아 성찰 에세이 자아 성찰 에세이",
    sessionCount: 11,
    imageUrl: JOURNEY_IMAGE_2,
    category: "마음챙김",
  },
  {
    id: "5",
    title: "나를 찾는 여행",
    description:
      "자아 성찰 에세이 자아 성찰 에세이 자아 성찰 에세이 자아 성찰 에세이 자아 성찰 에세이",
    sessionCount: 11,
    imageUrl: JOURNEY_IMAGE_2,
    category: "글쓰기 기술",
  },
]

function JourneyListCard({ card }: { card: JourneyCardData }) {
  return (
    <div className="flex h-32 items-center gap-5 rounded-3xl bg-surface p-4">
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
    </div>
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
