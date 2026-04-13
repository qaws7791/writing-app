"use client"

import { useEffect, useRef, useState } from "react"
import { usePromptCategories, usePromptList } from "@/features/prompts"
import { PromptCard, PromptCategoryChips } from "@/features/prompts/components"
import type { PromptType, PromptCardData } from "@/features/prompts/components"

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
      <PromptCategoryChips
        selectedType={selectedType}
        categories={categoriesData?.items ?? []}
        onSelectType={setSelectedType}
      />

      {/* Prompt Cards */}
      <div className="flex flex-col gap-12 px-4 pt-6 pb-8">
        {isLoading ? (
          <div className="py-12 text-center text-sm leading-6 text-muted/80">
            불러오는 중...
          </div>
        ) : prompts.length === 0 ? (
          <div className="py-12 text-center text-sm leading-6 text-muted/80">
            글감이 없습니다.
          </div>
        ) : (
          prompts.map((prompt) => (
            <PromptCard key={prompt.id} card={prompt as PromptCardData} />
          ))
        )}
        {isFetchingNextPage && (
          <div className="py-4 text-center text-sm leading-6 text-muted/80">
            불러오는 중...
          </div>
        )}
        <div ref={sentinelRef} className="h-px" />
      </div>
    </div>
  )
}
