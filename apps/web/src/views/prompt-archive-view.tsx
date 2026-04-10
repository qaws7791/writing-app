"use client"

import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Bookmark01Icon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { usePromptCategories, usePromptList } from "@/features/prompts"

type PromptType = "sensory" | "reflection" | "opinion"

function CategoryBadge({ promptType }: { promptType: PromptType }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-label-small uppercase ${
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

interface PromptCardItem {
  id: number
  promptType: PromptType
  title: string
  thumbnailUrl: string
  responseCount: number
  isBookmarked: boolean
}

function PromptCard({ card }: { card: PromptCardItem }) {
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
  const [selectedType, setSelectedType] = useState<PromptType | undefined>(
    undefined
  )
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data: categoriesData } = usePromptCategories()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    usePromptList({ promptType: selectedType, limit: 10 })

  const prompts = data?.pages.flatMap((page) => page.items) ?? []

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="flex flex-col">
      {/* Category Filter Chips */}
      <div className="flex gap-2.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]">
        <button
          onClick={() => setSelectedType(undefined)}
          className={`shrink-0 rounded-full px-5 py-2.5 text-title-small whitespace-nowrap transition-colors ${
            selectedType === undefined
              ? "bg-primary text-on-primary"
              : "bg-secondary-container text-on-surface-low"
          }`}
        >
          전체
        </button>
        {categoriesData?.items.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedType(cat.key as PromptType)}
            className={`shrink-0 rounded-full px-5 py-2.5 text-title-small whitespace-nowrap transition-colors ${
              selectedType === cat.key
                ? "bg-primary text-on-primary"
                : "bg-secondary-container text-on-surface-low"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Prompt Cards */}
      <div className="flex flex-col gap-12 px-4 pt-6 pb-8">
        {isLoading ? (
          <div className="py-12 text-center text-body-medium text-on-surface-lowest">
            불러오는 중...
          </div>
        ) : prompts.length === 0 ? (
          <div className="py-12 text-center text-body-medium text-on-surface-lowest">
            글감이 없습니다.
          </div>
        ) : (
          prompts.map((prompt) => (
            <PromptCard key={prompt.id} card={prompt as PromptCardItem} />
          ))
        )}
        {isFetchingNextPage && (
          <div className="py-4 text-center text-body-medium text-on-surface-lowest">
            불러오는 중...
          </div>
        )}
        <div ref={sentinelRef} className="h-px" />
      </div>
    </div>
  )
}
