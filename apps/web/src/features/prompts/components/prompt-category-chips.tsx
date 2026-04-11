"use client"

import { Chip } from "@workspace/ui/components/chip"
import type { PromptType } from "./prompt-card"

interface PromptCategoryChipsProps {
  selectedType: PromptType | undefined
  categories: Array<{ key: string; label: string }>
  onSelectType: (type: PromptType | undefined) => void
}

export function PromptCategoryChips({
  selectedType,
  categories,
  onSelectType,
}: PromptCategoryChipsProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]">
      <Chip
        variant="filter"
        selected={selectedType === undefined}
        onSelect={() => onSelectType(undefined)}
        className="shrink-0"
      >
        전체
      </Chip>
      {categories.map((cat) => (
        <Chip
          key={cat.key}
          variant="filter"
          selected={selectedType === cat.key}
          onSelect={() => onSelectType(cat.key as PromptType)}
          className="shrink-0"
        >
          {cat.label}
        </Chip>
      ))}
    </div>
  )
}
