"use client"

import { useState } from "react"

import { StepBody, StepHeader, StepTitle } from "#ui/components/ui/step"
import {
  Token,
  TokenBank,
  TokenSentence,
  TokenSlot,
} from "#ui/components/ui/token"
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
    <>
      <StepHeader>
        <StepTitle>
          <h2>빈칸을 채워보세요</h2>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <TokenSentence>
          {template.split("___").map((part, index) => {
            const selectedChoiceId = selectedChoiceIds[index]
            const selectedChoiceText = getChoiceText(choices, selectedChoiceId)
            const state =
              checked === false
                ? selectedChoiceId === null || selectedChoiceId === undefined
                  ? "empty"
                  : "filled"
                : selectedChoiceId === null || selectedChoiceId === undefined
                  ? "locked"
                  : checked === "correct"
                    ? "correct"
                    : "incorrect"

            return (
              <span key={index}>
                {part}
                {index < blankCount ? (
                  <TokenSlot
                    aria-label={`${index + 1}번째 빈칸${selectedChoiceText ? ` ${selectedChoiceText}, 선택 해제` : ", 비어 있음"}`}
                    disabled={checked !== false || selectedChoiceId === null}
                    onClick={() => handleRemoveChoice(index)}
                    state={state}
                  >
                    {selectedChoiceText ?? "___"}
                  </TokenSlot>
                ) : null}
              </span>
            )
          })}
        </TokenSentence>
        <TokenBank aria-label="선택할 낱말">
          {choices.map((choice) => {
            const used = selectedChoiceIds.includes(choice.id)
            return (
              <Token
                aria-pressed={used}
                key={choice.id}
                disabled={used || checked !== false}
                onClick={() => handleSelectChoice(choice.id)}
                state={used ? "used" : checked === false ? "idle" : "locked"}
              >
                {choice.text}
              </Token>
            )
          })}
        </TokenBank>
      </StepBody>
    </>
  )
}

function getChoiceText(
  choices: readonly FillBlankChoice<string>[],
  choiceId: string | null | undefined
): string | null {
  if (choiceId === null || choiceId === undefined) return null
  return choices.find((choice) => choice.id === choiceId)?.text ?? null
}
