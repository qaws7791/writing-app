"use client"

import { useState } from "react"

import { cn } from "../../lib/utils"
import type { LessonStepCheckedVisual } from "./lesson-step-checked-visual"

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
    "secondary" | "primary" | "correct" | "wrong",
    { bg: string; text: string }
  > = {
    secondary: { bg: "bg-surface", text: "text-charcoal" },
    primary: { bg: "bg-primary", text: "text-ink" },
    correct: { bg: "bg-success", text: "text-success-foreground" },
    wrong: { bg: "bg-danger", text: "text-danger-foreground" },
  }

  const stateMap = {
    secondary: "idle",
    primary: "selected",
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
          let variant: "secondary" | "primary" | "correct" | "wrong" =
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
            variant = "primary"

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
