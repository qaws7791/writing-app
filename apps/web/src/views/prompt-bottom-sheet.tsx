"use client"

import { useState } from "react"
import { Modal } from "@workspace/ui/components/modal"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Button } from "@workspace/ui/components/button"
import { ToggleButton } from "@workspace/ui/components/toggle-button"
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
    <Modal isOpen={open} onOpenChange={onOpenChange}>
      <Modal.Backdrop />
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>어떤 이야기를 꺼내볼까요?</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-4">
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
                  <div className="text-body-medium text-on-surface-lowest py-8 text-center">
                    글감이 없습니다.
                  </div>
                ) : (
                  prompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      type="button"
                      onClick={() => onSelectPrompt(prompt.id)}
                      className="bg-surface-container hover:bg-surface-container-high flex w-full flex-col gap-2 rounded-2xl p-4 text-left transition-colors"
                    >
                      <span className="bg-secondary-container text-label-small text-on-surface-low self-start rounded-full px-2.5 py-0.5 uppercase">
                        {PROMPT_TYPE_LABEL[prompt.promptType as PromptType]}
                      </span>
                      <h3 className="text-title-small-em text-on-surface">
                        {prompt.title}
                      </h3>
                      <p className="text-body-small text-on-surface-low line-clamp-1">
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
                variant="secondary"
                size="lg"
                onPress={() => onOpenChange(false)}
                fullWidth
                className="mt-2"
              >
                직접 쓸게요
              </Button>
            </div>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  )
}
