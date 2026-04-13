"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Chip } from "@workspace/ui/components/chip"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ToggleButton } from "@workspace/ui/components/toggle-button"
import { Card } from "@workspace/ui/components/card"
import { usePromptCategories, usePromptList } from "@/features/prompts"

type PromptType = "sensory" | "reflection" | "opinion"

const PROMPT_TYPE_LABEL: Record<PromptType, string> = {
  sensory: "감각",
  reflection: "회고",
  opinion: "의견",
}

function PromptCard({
  id,
  promptType,
  title,
  body,
  responseCount,
}: {
  id: number
  promptType: PromptType
  title: string
  body: string
  responseCount: number
}) {
  const router = useRouter()

  return (
    <Card.Root
      className="hover:bg-surface-container-high cursor-pointer transition-colors"
      onClick={() => router.push(`/writings/new/editor?promptId=${id}`)}
    >
      <Card.Content className="flex flex-col gap-3 p-6">
        <Chip variant="secondary" size="sm" className="self-start">
          {PROMPT_TYPE_LABEL[promptType]}
        </Chip>
        <Card.Title>{title}</Card.Title>
        <Card.Description className="line-clamp-2">{body}</Card.Description>
        <span className="text-label-small text-on-surface-lowest">
          {responseCount}명이 이 글감으로 글을 썬어요
        </span>
      </Card.Content>
    </Card.Root>
  )
}

export default function WritingEntryView() {
  const router = useRouter()
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
    <div className="flex h-dvh flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 bg-surface px-4 py-3">
        <Button
          isIconOnly
          variant="ghost"
          aria-label="뒤로 가기"
          onPress={() => router.back()}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </Button>
        <span className="text-label-large-em text-on-surface flex-1 text-center">
          새 글 쓰기
        </span>
        <div className="size-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Title */}
        <div className="px-2 pt-4 pb-6">
          <h1 className="text-headline-medium-em text-on-surface">
            오늘 어떤 글을 써볼까요?
          </h1>
          <p className="text-body-medium text-on-surface-low mt-2">
            글감을 선택하거나 자유롭게 시작할 수 있어요
          </p>
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-2.5 overflow-x-auto py-2.5 [scrollbar-width:none]">
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

        {/* Prompt Cards */}
        <div className="flex flex-col gap-4 pt-6">
          {isLoading ? (
            Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-36 rounded-3xl" />
            ))
          ) : prompts.length === 0 ? (
            <div className="text-body-medium text-on-surface-lowest py-12 text-center">
              글감이 없습니다.
            </div>
          ) : (
            prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                id={prompt.id}
                promptType={prompt.promptType as PromptType}
                title={prompt.title}
                body={prompt.body}
                responseCount={prompt.responseCount}
              />
            ))
          )}
        </div>
      </div>

      {/* 항상 보이는 하단 고정 버튼 */}
      <div className="border-outline-variant shrink-0 border-t bg-surface px-4 py-4">
        <Button
          variant="secondary"
          size="lg"
          onPress={() => router.push("/writings/new/editor")}
          fullWidth
        >
          직접 쓸게요
        </Button>
      </div>
    </div>
  )
}
