"use client"

import { useState } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/ui/drawer"
import { Skeleton } from "@workspace/ui/components/ui/skeleton"
import { Button } from "@workspace/ui/components/ui/button"
import { ToggleButton } from "@workspace/ui/components/ui/toggle-button"
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
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>어떤 이야기를 꺼내볼까요?</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
          {/* Category Filter Chips */}
          <div className="flex gap-2.5 overflow-x-auto py-1 [scrollbar-width:none]">
            <ToggleButton
              isSelected={selectedType === undefined}
              onChange={() => setSelectedType(undefined)}
              className="shrink-0"
            >
              전체
            </ToggleButton>
            {categoriesData?.items.map((cat) => (
              <ToggleButton
                key={cat.key}
                isSelected={selectedType === cat.key}
                onChange={() => setSelectedType(cat.key as PromptType)}
                className="shrink-0"
              >
                {cat.label}
              </ToggleButton>
            ))}
          </div>

          {/* Prompt List */}
          <div className="flex flex-col gap-3 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-24 rounded-2xl" />
              ))
            ) : prompts.length === 0 ? (
              <div className="py-8 text-center text-sm leading-6 text-muted-foreground/80">
                글감이 없습니다.
              </div>
            ) : (
              prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => onSelectPrompt(prompt.id)}
                  className="flex w-full flex-col gap-2 rounded-2xl bg-muted p-4 text-left transition-colors hover:bg-accent"
                >
                  <span className="self-start rounded-full bg-accent/50 px-2.5 py-0.5 text-xs leading-4 font-medium text-muted-foreground uppercase">
                    {PROMPT_TYPE_LABEL[prompt.promptType as PromptType]}
                  </span>
                  <h3 className="text-base leading-6 font-semibold text-foreground">
                    {prompt.title}
                  </h3>
                  <p className="line-clamp-1 text-xs leading-5 text-muted-foreground">
                    {prompt.body}
                  </p>
                  <span className="text-xs leading-4 font-medium text-muted-foreground/80">
                    {prompt.responseCount}명이 이 글감으로 글을 썼어요
                  </span>
                </button>
              ))
            )}
          </div>

          {/* "직접 쓸게요" button */}
          <Button
            variant="secondary"
            size="lg"
            onClick={() => onOpenChange(false)}
            className="mt-2 w-full"
          >
            직접 쓸게요
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
