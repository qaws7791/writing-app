"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Bookmark01Icon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"

export type PromptType = "sensory" | "reflection" | "opinion"

function CategoryBadge({ promptType }: { promptType: PromptType }) {
  return (
    <span
      className={`text-label-small rounded-full px-3 py-1 uppercase ${
        promptType === "opinion"
          ? "bg-surface-container-high text-on-surface"
          : "bg-secondary-container text-on-surface-low"
      }`}
    >
      {promptType === "sensory"
        ? "감각"
        : promptType === "reflection"
          ? "회고"
          : "의견"}
    </span>
  )
}

export interface PromptCardData {
  id: number
  promptType: PromptType
  title: string
  thumbnailUrl: string
  responseCount: number
  isBookmarked: boolean
}

export function PromptCard({ card }: { card: PromptCardData }) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => router.push(`/prompts/${card.id}`)}
        className="relative h-64 w-full overflow-hidden rounded-[3rem] bg-surface transition-opacity hover:opacity-90"
      >
        <div className="absolute inset-8 flex items-center justify-center opacity-80">
          <img
            src={card.thumbnailUrl}
            alt={card.title}
            className="h-full w-auto object-contain"
          />
        </div>
      </button>
      <div className="flex flex-col gap-3 px-2">
        <div className="flex items-center gap-3">
          <CategoryBadge promptType={card.promptType} />
        </div>
        <button
          type="button"
          onClick={() => router.push(`/prompts/${card.id}`)}
          className="text-left"
        >
          <p className="text-title-large-em text-on-surface">{card.title}</p>
        </button>
        <div className="flex items-center justify-between pt-3">
          <span className="text-label-medium text-on-surface-lowest">
            {card.responseCount}명 응답
          </span>
          <Button aria-label="북마크" variant="ghost" isIconOnly>
            <HugeiconsIcon
              icon={Bookmark01Icon}
              size={24}
              color="currentColor"
              strokeWidth={1.5}
            />
          </Button>
        </div>
      </div>
    </div>
  )
}
