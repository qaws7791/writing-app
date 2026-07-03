import { useState } from "react"

import type { StepProps } from "./step-types"
import type { MultipleChoiceStep } from "../lesson-types"
import { emitAnswer } from "../utils/emit-answer"
import { cn } from "@workspace/ui/lib/utils"

export function MultipleChoiceAnswer({
  checked,
  onAnswerChange,
  onAnswerPayloadChange,
  step,
}: StepProps<MultipleChoiceStep>) {
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
        {step.question}
      </h2>
      <div className="space-y-3">
        {step.options.map((option) => {
          let variant: "secondary" | "primary" | "correct" | "wrong" =
            "secondary"
          if (checked === "correct" && option.id === step.correct)
            variant = "correct"
          else if (
            checked === "wrong" &&
            selectedOptionId === option.id &&
            option.id !== step.correct
          )
            variant = "wrong"
          else if (checked === "wrong" && option.id === step.correct)
            variant = "correct"
          else if (checked === false && selectedOptionId === option.id)
            variant = "primary"

          const c = MC_COLORS[variant]
          const faded =
            checked !== false &&
            option.id !== step.correct &&
            selectedOptionId !== option.id

          return (
            <button
              key={option.id}
              onClick={() => {
                if (checked === false) {
                  setSelectedOptionId(option.id)
                  emitAnswer(
                    onAnswerChange,
                    step.id,
                    {
                      selectedOptionId: option.id,
                      type: "MULTIPLE_CHOICE",
                    },
                    onAnswerPayloadChange
                  )
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
