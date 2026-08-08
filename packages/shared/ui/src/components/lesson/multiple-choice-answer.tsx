"use client"

import { useState } from "react"

import {
  Choice,
  ChoiceContent,
  ChoiceGroup,
  ChoiceLabel,
  type ChoiceState,
} from "#ui/components/ui/choice"
import { StepBody, StepHeader, StepTitle } from "#ui/components/ui/step"
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

  return (
    <>
      <StepHeader>
        <StepTitle>
          <h2>{question}</h2>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <ChoiceGroup aria-label={question} type="single">
          {options.map((option) => {
            const isSelected = selectedOptionId === option.id
            const state: ChoiceState =
              checked === false
                ? isSelected
                  ? "selected"
                  : "idle"
                : option.id === correctOptionId
                  ? "correct"
                  : isSelected
                    ? "incorrect"
                    : "locked"

            return (
              <Choice
                key={option.id}
                onClick={() => {
                  if (checked === false) {
                    setSelectedOptionId(option.id)
                    onSelect?.(option.id)
                  }
                }}
                selected={isSelected}
                state={state}
              >
                <ChoiceContent>
                  <ChoiceLabel>{option.text}</ChoiceLabel>
                </ChoiceContent>
              </Choice>
            )
          })}
        </ChoiceGroup>
      </StepBody>
    </>
  )
}
