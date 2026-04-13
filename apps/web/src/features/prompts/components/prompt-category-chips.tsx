"use client"

import { ToggleButton } from "@workspace/ui/components/toggle-button"
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
      <ToggleButton
        isSelected={selectedType === undefined}
        onChange={() => onSelectType(undefined)}
        className="shrink-0"
      >
        전체
      </ToggleButton>
      {categories.map((cat) => (
        <ToggleButton
          key={cat.key}
          isSelected={selectedType === cat.key}
          onChange={() => onSelectType(cat.key as PromptType)}
          className="shrink-0"
        >
          {cat.label}
        </ToggleButton>
      ))}
    </div>
  )
}
