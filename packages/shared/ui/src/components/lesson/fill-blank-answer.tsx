"use client"

import { useState } from "react"

import { buttonVariants } from "#ui/components/ui/button"
import { cn } from "#ui/lib/utils"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"

type FillBlankChoice<TId extends string> = {
  readonly id: TId
  readonly text: string
}

export function FillBlankAnswer<TId extends string>({
  blankCount,
  checked = false,
  choices,
  defaultSelectedChoiceIds = [],
  onChange,
  template,
}: {
  readonly blankCount: number
  readonly checked?: LessonStepCheckedVisual
  readonly choices: readonly FillBlankChoice<TId>[]
  readonly defaultSelectedChoiceIds?: readonly TId[]
  readonly onChange?: (selectedChoiceIds: readonly TId[]) => void
  readonly template: string
}) {
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<
    readonly (TId | null)[]
  >(() =>
    Array.from(
      { length: blankCount },
      (_, index) => defaultSelectedChoiceIds[index] ?? null
    )
  )

  function emitChange(nextChoiceIds: readonly (TId | null)[]) {
    onChange?.(nextChoiceIds.flatMap((id) => (id === null ? [] : [id])))
  }

  function handleSelectChoice(choiceId: TId) {
    if (checked !== false) return

    const isAlreadyUsed = selectedChoiceIds.includes(choiceId)
    if (isAlreadyUsed) return

    const nextChoiceIds = [...selectedChoiceIds]
    const emptyIndex = nextChoiceIds.indexOf(null)
    if (emptyIndex !== -1) {
      nextChoiceIds[emptyIndex] = choiceId
      setSelectedChoiceIds(nextChoiceIds)
      emitChange(nextChoiceIds)
    }
  }

  function handleRemoveChoice(index: number) {
    if (checked !== false) return

    const nextChoiceIds = [...selectedChoiceIds]
    nextChoiceIds[index] = null
    setSelectedChoiceIds(nextChoiceIds)
    emitChange(nextChoiceIds)
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
                aria-label={`${index + 1}번째 빈칸${selectedChoiceIds[index] ? ` ${getChoiceText(choices, selectedChoiceIds[index])}, 선택 해제` : ", 비어 있음"}`}
                disabled={
                  checked !== false || selectedChoiceIds[index] === null
                }
                onClick={() => handleRemoveChoice(index)}
                className={cn(
                  "inline-block min-w-[80px] px-3 py-1 rounded-xl mx-1 text-center",
                  selectedChoiceIds[index]
                    ? "bg-action-selected-bg text-action-selected-fg font-bold cursor-pointer"
                    : "bg-bg-surface"
                )}
                type="button"
              >
                {getChoiceText(choices, selectedChoiceIds[index]) ?? "___"}
              </button>
            ) : null}
          </span>
        ))}
      </p>
      <div className="flex flex-wrap gap-3">
        {choices.map((choice) => {
          const used = selectedChoiceIds.includes(choice.id)
          return (
            <button
              aria-pressed={used}
              key={choice.id}
              disabled={used || checked !== false}
              onClick={() => handleSelectChoice(choice.id)}
              className={buttonVariants({
                className: cn(
                  "h-auto rounded-full px-5 py-3 text-base disabled:opacity-100",
                  used
                    ? "bg-bg-surface text-fg-muted hover:bg-bg-surface"
                    : "bg-bg-surface text-fg-default hover:bg-action-selected-bg hover:text-action-selected-fg"
                ),
                variant: "secondary",
              })}
              style={{ fontSize: "1rem" }}
              type="button"
            >
              {choice.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function getChoiceText(
  choices: readonly FillBlankChoice<string>[],
  choiceId: string | null | undefined
): string | null {
  if (choiceId === null || choiceId === undefined) return null
  return choices.find((choice) => choice.id === choiceId)?.text ?? null
}
