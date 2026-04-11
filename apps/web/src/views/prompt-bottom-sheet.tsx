"use client"

import { useState } from "react"
import { Drawer, DrawerContent } from "@workspace/ui/components/drawer"
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!rounded-t-[32px] !border-t-0 bg-surface-container-lowest px-4 pt-3 pb-9 [&>div:first-child]:!hidden">
        {/* Handle bar */}
        <div className="mx-auto mb-6 h-[5px] w-[45px] rounded-full bg-on-surface-lowest" />

        <div className="flex max-h-[70dvh] flex-col gap-4">
          {/* Title */}
          <div className="px-2">
            <h2 className="text-title-large-em text-on-surface">
              어떤 이야기를 꺼내볼까요?
            </h2>
          </div>

          {/* Category Filter Chips */}
          <div className="flex gap-2.5 overflow-x-auto py-1 [scrollbar-width:none]">
            <button
              onClick={() => setSelectedType(undefined)}
              className={`shrink-0 rounded-full px-4 py-2 text-label-large whitespace-nowrap transition-colors ${
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
                className={`shrink-0 rounded-full px-4 py-2 text-label-large whitespace-nowrap transition-colors ${
                  selectedType === cat.key
                    ? "bg-primary text-on-primary"
                    : "bg-secondary-container text-on-surface-low"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Prompt List */}
          <div className="flex flex-col gap-3 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-2xl bg-surface-container"
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
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mt-2 w-full rounded-[1rem] bg-surface-container py-3 text-title-small-em text-on-surface transition-colors hover:bg-surface-container-high"
          >
            직접 쓸게요
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
