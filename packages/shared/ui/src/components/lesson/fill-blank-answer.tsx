"use client"

import { useState } from "react"

import { buttonVariants } from "#ui/components/ui/button"
import { cn } from "#ui/lib/utils"
import type { LessonStepCheckedVisual } from "#ui/components/lesson/lesson-step-checked-visual"

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
              <button
                aria-label={`${index + 1}번째 빈칸${selectedWords[index] ? ` ${selectedWords[index]}, 선택 해제` : ", 비어 있음"}`}
                disabled={checked !== false || selectedWords[index] === null}
                onClick={() => handleRemoveWord(index)}
                className={cn(
                  "inline-block min-w-[80px] px-3 py-1 rounded-xl mx-1 text-center",
                  selectedWords[index]
                    ? "bg-accent text-accent-foreground font-bold cursor-pointer"
                    : "bg-surface"
                )}
                type="button"
              >
                {selectedWords[index] ?? "___"}
              </button>
            ) : null}
          </span>
        ))}
      </p>
      <div className="flex flex-wrap gap-3">
        {words.map((word) => {
          const used = selectedWords.includes(word)
          return (
            <button
              aria-pressed={used}
              key={word}
              disabled={used || checked !== false}
              onClick={() => handleSelectWord(word)}
              className={buttonVariants({
                className: cn(
                  "h-auto rounded-full px-5 py-3 text-base disabled:opacity-100",
                  used
                    ? "bg-surface text-muted-foreground hover:bg-surface"
                    : "bg-surface text-charcoal hover:bg-accent hover:text-accent-foreground"
                ),
                variant: "secondary",
              })}
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
