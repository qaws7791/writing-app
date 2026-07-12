"use client"

import { useState } from "react"

import { cn } from "#ui/lib/utils"
import type { LessonStepCheckedVisual } from "#ui/components/lesson/lesson-step-checked-visual"

export function MultipleChoiceAnswer({
  checked = false,
  correctOptionId,
  onSelect,
  options,
  question,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly correctOptionId: string
  readonly onSelect?: (optionId: string) => void
  readonly options: readonly {
    readonly id: string
    readonly text: string
  }[]
  readonly question: string
}) {
  const [selectedOptionId, setSelectedOptionId] = useState<null | string>(null)

  const MC_COLORS: Record<
    "secondary" | "selected" | "correct" | "wrong",
    { bg: string; text: string }
  > = {
    secondary: { bg: "bg-surface", text: "text-charcoal" },
    selected: { bg: "bg-accent", text: "text-accent-foreground" },
    correct: { bg: "bg-mint-light", text: "text-charcoal" },
    wrong: { bg: "bg-coral-light", text: "text-charcoal" },
  }

  const stateMap = {
    secondary: "idle",
    selected: "selected",
    correct: "correct",
    wrong: "wrong",
  } as const

  return (
    <div className="an-fi">
      <h2
        className="font-bold mb-8"
        style={{ fontSize: "1.625rem", lineHeight: 1.3 }}
      >
        {question}
      </h2>
      <div className="space-y-3">
        {options.map((option) => {
          let variant: "secondary" | "selected" | "correct" | "wrong" =
            "secondary"
          if (checked === "correct" && option.id === correctOptionId)
            variant = "correct"
          else if (
            checked === "wrong" &&
            selectedOptionId === option.id &&
            option.id !== correctOptionId
          )
            variant = "wrong"
          else if (checked === "wrong" && option.id === correctOptionId)
            variant = "correct"
          else if (checked === false && selectedOptionId === option.id)
            variant = "selected"

          const c = MC_COLORS[variant]
          const faded =
            checked !== false &&
            option.id !== correctOptionId &&
            selectedOptionId !== option.id

          return (
            <button
              key={option.id}
              onClick={() => {
                if (checked === false) {
                  setSelectedOptionId(option.id)
                  onSelect?.(option.id)
                }
              }}
              disabled={faded}
              data-state={stateMap[variant]}
              className={cn(
                "w-full px-5 py-4 rounded-3xl text-left font-medium btn-squish transition-colors",
                c.bg,
                c.text,
                faded && "opacity-40"
              )}
              style={{ fontSize: "1rem" }}
              type="button"
            >
              {option.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
