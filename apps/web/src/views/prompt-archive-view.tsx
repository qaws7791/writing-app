"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Bookmark01Icon } from "@hugeicons/core-free-icons"

const PROMPT_IMAGES = {
  card1:
    "https://www.figma.com/api/mcp/asset/7b7a9ecc-692c-450a-a3a0-9d074037055e",
  card2:
    "https://www.figma.com/api/mcp/asset/39371be0-37aa-4fb8-900a-4db8f1c5ecde",
  card3:
    "https://www.figma.com/api/mcp/asset/dacc17e5-cbdd-4ac7-b1be-20159f18de40",
}

const CATEGORIES = ["전체", "감각", "회고", "의견"] as const
type Category = (typeof CATEGORIES)[number]

interface PromptCardData {
  id: string
  date: string
  category: Exclude<Category, "전체">
  title: string
  responseCount: number
  imageUrl: string
  cardVariant: "default" | "elevated"
}

const PROMPT_CARDS: PromptCardData[] = [
  {
    id: "1",
    date: "3월 31일 (화)",
    category: "감각",
    title: "오늘 아침 처음 든 생각은?",
    responseCount: 261,
    imageUrl: PROMPT_IMAGES.card1,
    cardVariant: "default",
  },
  {
    id: "2",
    date: "3월 30일 (월)",
    category: "회고",
    title: "나를 설레게 하는 작은 순간들",
    responseCount: 184,
    imageUrl: PROMPT_IMAGES.card2,
    cardVariant: "elevated",
  },
  {
    id: "3",
    date: "3월 29일 (일)",
    category: "의견",
    title: "행복은 발견하는 것일까, 만드는 것일까?",
    responseCount: 302,
    imageUrl: PROMPT_IMAGES.card3,
    cardVariant: "default",
  },
]

function CategoryBadge({ category }: { category: Exclude<Category, "전체"> }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] tracking-wide uppercase ${
        category === "의견"
          ? "bg-surface-container-high text-on-surface"
          : "bg-secondary-container text-on-surface-low"
      }`}
    >
      {category}
    </span>
  )
}

function PromptCard({ card }: { card: PromptCardData }) {
  return (
    <div className="flex flex-col gap-6">
      <div
        className={`relative h-64 overflow-hidden rounded-[3rem] ${
          card.cardVariant === "elevated"
            ? "bg-surface-container-high"
            : "bg-surface"
        }`}
      >
        <div className="absolute inset-8 flex items-center justify-center opacity-80">
          <img
            src={card.imageUrl}
            alt={card.title}
            className="h-full w-auto object-contain"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 px-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-on-surface-low">
            {card.date}
          </span>
          <CategoryBadge category={card.category} />
        </div>
        <p className="text-2xl leading-tight font-medium tracking-tight text-on-surface">
          {card.title}
        </p>
        <div className="flex items-center justify-between pt-3">
          <span className="text-xs font-medium text-on-surface-lowest">
            {card.responseCount}명 응답
          </span>
          <button
            aria-label="북마크"
            className="text-on-surface-lowest transition-colors hover:text-on-surface"
          >
            <HugeiconsIcon
              icon={Bookmark01Icon}
              size={24}
              color="currentColor"
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PromptArchiveView() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("전체")

  const filteredPrompts =
    selectedCategory === "전체"
      ? PROMPT_CARDS
      : PROMPT_CARDS.filter((prompt) => prompt.category === selectedCategory)

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

      {/* Prompt Cards */}
      <div className="flex flex-col gap-12 px-4 pt-6 pb-8">
        {filteredPrompts.map((prompt) => (
          <PromptCard key={prompt.id} card={prompt} />
        ))}
      </div>
    </div>
  )
}
