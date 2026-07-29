"use client"

import { useState } from "react"

import { cn } from "#ui/lib/utils"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"

export function SelectAnswer({
  checked = false,
  correctIndexes,
  defaultSelectedIndexes = [],
  explanation,
  layout,
  onChange,
  question,
  segments,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly correctIndexes: readonly number[]
  readonly defaultSelectedIndexes?: readonly number[]
  readonly explanation?: string
  readonly layout?: string
  readonly onChange?: (selectedIndexes: readonly number[]) => void
  readonly question: string
  readonly segments: readonly string[]
}) {
  const [selectedIndexes, setSelectedIndexes] = useState<readonly number[]>(
    defaultSelectedIndexes
  )
  const isBlock = layout === "block"

  return (
    <div className="an-fi">
      <h2
        className="font-bold mb-10"
        style={{ fontSize: "1.625rem", lineHeight: 1.3 }}
      >
        {question}
      </h2>
      <div
        className={
          isBlock ? "flex flex-col gap-3" : "flex flex-wrap gap-x-2.5 gap-y-3"
        }
      >
        {segments.map((segment, index) => {
          const isSelected = selectedIndexes.includes(index)
          const isCorrect = correctIndexes.includes(index)
          let cls = "bg-bg-surface"
          if (checked !== false) {
            if (isCorrect && isSelected)
              cls = "bg-success text-success-foreground"
            else if (isCorrect && !isSelected)
              cls = "bg-success text-success-foreground"
            else if (isSelected) cls = "bg-danger text-danger-foreground"
          } else if (isSelected)
            cls = "bg-action-selected-bg text-action-selected-fg"
          return (
            <button
              aria-pressed={isSelected}
              disabled={checked !== false}
              key={segment}
              onClick={() => {
                if (checked === false) {
                  const nextIndexes = selectedIndexes.includes(index)
                    ? selectedIndexes.filter((value) => value !== index)
                    : [...selectedIndexes, index]
                  setSelectedIndexes(nextIndexes)
                  onChange?.(nextIndexes)
                }
              }}
              className={cn(
                "cursor-pointer font-medium transition-all duration-150 active:scale-95 rounded-3xl disabled:cursor-default",
                isBlock ? "block p-4 text-left" : "px-5 py-2.5",
                cls
              )}
              style={{
                fontSize: isBlock ? "1.05rem" : "1.15rem",
                lineHeight: isBlock ? 1.5 : undefined,
              }}
              type="button"
            >
              {segment}
            </button>
          )
        })}
      </div>
      {checked !== false && explanation ? (
        <div className="mt-8 bg-bg-surface rounded-4xl p-6">
          <div className="font-bold text-fg-muted mb-2">해설</div>
          <p className="font-medium">{explanation}</p>
        </div>
      ) : null}
    </div>
  )
}
