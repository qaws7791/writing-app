"use client"

import { useState } from "react"

import { buttonVariants } from "#ui/components/ui/button"
import { cn } from "#ui/lib/utils"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"

export function MultipleChoiceAnswer({
  checked = false,
  correctOptionId,
  defaultSelectedOptionId = null,
  onSelect,
  options,
  question,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly correctOptionId: string
  readonly defaultSelectedOptionId?: string | null
  readonly onSelect?: (optionId: string) => void
  readonly options: readonly {
    readonly id: string
    readonly text: string
  }[]
  readonly question: string
}) {
  const [selectedOptionId, setSelectedOptionId] = useState<null | string>(
    defaultSelectedOptionId
  )

  const MC_COLORS: Record<
    "secondary" | "selected" | "correct" | "wrong",
    { bg: string; text: string }
  > = {
    secondary: { bg: "bg-bg-surface", text: "text-fg-default" },
    selected: {
      bg: "bg-action-selected-bg",
      text: "text-action-selected-fg",
    },
    correct: { bg: "bg-success", text: "text-success-foreground" },
    wrong: { bg: "bg-danger", text: "text-danger-foreground" },
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
          const buttonVariant =
            variant === "correct"
              ? "correct"
              : variant === "wrong"
                ? "wrong"
                : "secondary"
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
              className={buttonVariants({
                className: cn(
                  "h-auto w-full justify-start rounded-3xl px-5 py-4 text-left text-base font-medium",
                  c.bg,
                  c.text,
                  variant === "selected" && "hover:bg-action-selected-bg",
                  faded && "opacity-40"
                ),
                variant: buttonVariant,
              })}
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
