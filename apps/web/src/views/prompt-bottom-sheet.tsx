"use client"

import { useState } from "react"
import { BottomSheet } from "@workspace/ui/components/bottom-sheet"
import { Chip } from "@workspace/ui/components/chip"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Button } from "@workspace/ui/components/button"
import { usePromptCategories, usePromptList } from "@/features/prompts"

type PromptType = "sensory" | "reflection" | "opinion"

const PROMPT_TYPE_LABEL: Record<PromptType, string> = {
  sensory: "감각",
  reflection: "회고",
  opinion: "의견",
}

export default function PromptBottomSheet({
  open,
  onOpenChange,
  onSelectPrompt,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPrompt: (promptId: number) => void
}) {
  const [selectedType, setSelectedType] = useState<PromptType | undefined>(
    undefined
  )

  const { data: categoriesData } = usePromptCategories()
  const { data, isLoading } = usePromptList({
    promptType: selectedType,
    limit: 5,
  })

  const prompts = data?.pages.flatMap((page) => page.items) ?? []

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="어떤 이야기를 꺼내볼까요?"
    >
      <div className="flex flex-col gap-4">
        {/* Category Filter Chips */}
        <div className="flex gap-2.5 overflow-x-auto py-1 [scrollbar-width:none]">
          <Chip
            variant="filter"
            selected={selectedType === undefined}
            onSelect={() => setSelectedType(undefined)}
            className="shrink-0"
          >
            전체
          </Chip>
          {categoriesData?.items.map((cat) => (
            <Chip
              key={cat.key}
              variant="filter"
              selected={selectedType === cat.key}
              onSelect={() => setSelectedType(cat.key as PromptType)}
              className="shrink-0"
            >
              {cat.label}
            </Chip>
          ))}
        </div>

        {/* Prompt List */}
        <div className="flex flex-col gap-3 overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 3 }, (_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                className="h-24 rounded-2xl"
              />
            ))
          ) : prompts.length === 0 ? (
            <div className="py-8 text-center text-body-medium text-on-surface-lowest">
              글감이 없습니다.
            </div>
          ) : (
            prompts.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => onSelectPrompt(prompt.id)}
                className="flex w-full flex-col gap-2 rounded-2xl bg-surface-container p-4 text-left transition-colors hover:bg-surface-container-high"
              >
                <span className="self-start rounded-full bg-secondary-container px-2.5 py-0.5 text-label-small text-on-surface-low uppercase">
                  {PROMPT_TYPE_LABEL[prompt.promptType as PromptType]}
                </span>
                <h3 className="text-title-small-em text-on-surface">
                  {prompt.title}
                </h3>
                <p className="line-clamp-1 text-body-small text-on-surface-low">
                  {prompt.body}
                </p>
                <span className="text-label-small text-on-surface-lowest">
                  {prompt.responseCount}명이 이 글감으로 글을 썼어요
                </span>
              </button>
            ))
          )}
        </div>

        {/* "직접 쓸게요" button */}
        <Button
          variant="tonal"
          size="lg"
          onClick={() => onOpenChange(false)}
          className="mt-2 w-full"
        >
          직접 쓸게요
        </Button>
      </div>
    </BottomSheet>
  )
}
