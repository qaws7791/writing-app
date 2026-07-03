import { useState } from "react"

import type { StepProps } from "./step-types"
import type { FillBlankStep } from "../lesson-types"
import { emitAnswer } from "../utils/emit-answer"
import { cn } from "@workspace/ui/lib/utils"

export function FillBlankAnswer({
  checked,
  onAnswerChange,
  step,
}: StepProps<FillBlankStep>) {
  const [selectedWords, setSelectedWords] = useState<
    readonly (string | null)[]
  >(() => Array.from({ length: step.answer.length }, () => null))

  function handleSelectWord(word: string) {
    if (checked !== false) return

    const isAlreadyUsed = selectedWords.includes(word)
    if (isAlreadyUsed) return

    const nextWords = [...selectedWords]
    const emptyIndex = nextWords.indexOf(null)
    if (emptyIndex !== -1) {
      nextWords[emptyIndex] = word
      setSelectedWords(nextWords)
      emitAnswer(onAnswerChange, step.id, {
        selectedWords: nextWords.map((w) => w ?? ""),
        type: "FILL_BLANK",
      })
    }
  }

  function handleRemoveWord(index: number) {
    if (checked !== false) return

    const nextWords = [...selectedWords]
    nextWords[index] = null
    setSelectedWords(nextWords)
    emitAnswer(onAnswerChange, step.id, {
      selectedWords: nextWords.map((w) => w ?? ""),
      type: "FILL_BLANK",
    })
  }

  return (
    <div className="an-fi flex flex-col gap-5">
      <h2 className="font-bold mb-8" style={{ fontSize: "1.75rem" }}>
        빈칸을 채워보세요
      </h2>
      <p
        className="font-medium leading-relaxed mb-10"
        style={{ fontSize: "1.25rem" }}
      >
        {step.template.split("___").map((part, index) => (
          <span key={index}>
            {part}
            {index < step.answer.length ? (
              <span
                onClick={() => handleRemoveWord(index)}
                className={cn(
                  "inline-block min-w-[80px] px-3 py-1 rounded-xl mx-1 text-center cursor-pointer",
                  selectedWords[index]
                    ? "bg-primary text-ink font-bold"
                    : "bg-surface"
                )}
              >
                {selectedWords[index] ?? "___"}
              </span>
            ) : null}
          </span>
        ))}
      </p>
      <div className="flex flex-wrap gap-3">
        {step.words.map((word) => {
          const used = selectedWords.includes(word)
          return (
            <button
              key={word}
              disabled={used || checked !== false}
              onClick={() => handleSelectWord(word)}
              className={cn(
                "px-5 py-3 rounded-full font-bold btn-squish",
                used
                  ? "bg-surface text-muted"
                  : "bg-surface text-charcoal hover:bg-primary hover:text-ink"
              )}
              style={{ fontSize: "1rem" }}
              type="button"
            >
              {word}
            </button>
          )
        })}
      </div>
    </div>
  )
}
