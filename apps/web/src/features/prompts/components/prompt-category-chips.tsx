"use client"

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
      <button
        onClick={() => onSelectType(undefined)}
        className={`shrink-0 rounded-full px-5 py-2.5 text-title-small whitespace-nowrap transition-colors ${
          selectedType === undefined
            ? "bg-primary text-on-primary"
            : "bg-secondary-container text-on-surface-low"
        }`}
      >
        전체
      </button>
      {categories.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onSelectType(cat.key as PromptType)}
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
  )
}
