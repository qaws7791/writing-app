"use client"

import { useState } from "react"

import { cn } from "../../lib/utils"
import type { LessonStepCheckedVisual } from "./lesson-step-checked-visual"

export function FillBlankAnswer({
  blankCount,
  checked = false,
  onChange,
  template,
  words,
}: {
  readonly blankCount: number
  readonly checked?: LessonStepCheckedVisual
  readonly onChange?: (selectedWords: readonly string[]) => void
  readonly template: string
  readonly words: readonly string[]
}) {
  const [selectedWords, setSelectedWords] = useState<
    readonly (string | null)[]
  >(() => Array.from({ length: blankCount }, () => null))

  function emitChange(nextWords: readonly (string | null)[]) {
    onChange?.(nextWords.map((word) => word ?? ""))
  }

  function handleSelectWord(word: string) {
    if (checked !== false) return

    const isAlreadyUsed = selectedWords.includes(word)
    if (isAlreadyUsed) return

    const nextWords = [...selectedWords]
    const emptyIndex = nextWords.indexOf(null)
    if (emptyIndex !== -1) {
      nextWords[emptyIndex] = word
      setSelectedWords(nextWords)
      emitChange(nextWords)
    }
  }

  function handleRemoveWord(index: number) {
    if (checked !== false) return

    const nextWords = [...selectedWords]
    nextWords[index] = null
    setSelectedWords(nextWords)
    emitChange(nextWords)
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
        {template.split("___").map((part, index) => (
          <span key={index}>
            {part}
            {index < blankCount ? (
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
        {words.map((word) => {
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
