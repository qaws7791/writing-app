import { useState } from "react"

import type { StepProps } from "./step-types"
import type { SelectStep } from "../lesson-types"
import { emitAnswer } from "../utils/emit-answer"
import { Surface } from "@workspace/ui/components/ui/surface"
import { cn } from "@workspace/ui/lib/utils"

export function SelectAnswer({
  checked,
  onAnswerChange,
  step,
}: StepProps<SelectStep>) {
  const [selectedIndexes, setSelectedIndexes] = useState<readonly number[]>([])
  const isBlock = step.layout === "block"

  return (
    <div className="an-fi">
      <h2
        className="font-bold mb-10"
        style={{ fontSize: "1.625rem", lineHeight: 1.3 }}
      >
        {step.question}
      </h2>
      <div
        className={
          isBlock ? "flex flex-col gap-3" : "flex flex-wrap gap-x-2.5 gap-y-3"
        }
      >
        {step.segments.map((segment, index) => {
          const isSelected = selectedIndexes.includes(index)
          const isCorrect = step.correct.includes(index)
          let cls = "bg-surface"
          if (checked !== false) {
            if (isCorrect && isSelected)
              cls = "bg-success text-success-foreground"
            else if (isCorrect && !isSelected)
              cls = "bg-success/30 text-success-foreground"
            else if (isSelected) cls = "bg-danger text-danger-foreground"
          } else if (isSelected) cls = "bg-primary text-ink"
          return (
            <span
              key={segment}
              onClick={() => {
                if (checked === false) {
                  const ws = [...(selectedIndexes || [])]
                  if (ws.includes(index))
                    setSelectedIndexes(ws.filter((x: number) => x !== index))
                  else setSelectedIndexes([...ws, index])
                  emitAnswer(onAnswerChange, step.id, {
                    selectedIndexes: ws.includes(index)
                      ? ws.filter((x: number) => x !== index)
                      : [...ws, index],
                    type: "SELECT",
                  })
                }
              }}
              className={cn(
                "cursor-pointer font-medium transition-all duration-150 active:scale-95 rounded-3xl",
                isBlock ? "block p-4 text-left" : "px-5 py-2.5",
                cls
              )}
              style={{
                fontSize: isBlock ? "1.05rem" : "1.15rem",
                lineHeight: isBlock ? 1.5 : undefined,
              }}
            >
              {segment}
            </span>
          )
        })}
      </div>
      {checked !== false && step.explanation ? (
        <Surface
          className="mt-8 bg-surface rounded-4xl p-6"
          size="md"
          variant="panel"
        >
          <div className="font-bold text-muted-foreground mb-2">해설</div>
          <p className="font-medium">{step.explanation}</p>
        </Surface>
      ) : null}
    </div>
  )
}
