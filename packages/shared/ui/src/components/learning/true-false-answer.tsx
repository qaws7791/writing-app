"use client"

import { useState } from "react"

import {
  Choice,
  ChoiceContent,
  ChoiceGroup,
  ChoiceLabel,
  type ChoiceState,
} from "#ui/components/learning/choice"
import {
  Insight,
  InsightDescription,
  InsightEyebrow,
} from "#ui/components/learning/insight"
import { StepBody, StepHeader, StepTitle } from "#ui/components/learning/step"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"

export type TrueFalseValue = boolean

const OPTIONS = [
  { id: "true", label: "참", value: true as const },
  { id: "false", label: "거짓", value: false as const },
] as const

export function TrueFalseAnswer({
  checked = false,
  correctAnswer,
  defaultSelected = null,
  explanation,
  onSelect,
  statement,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly correctAnswer: TrueFalseValue
  readonly defaultSelected?: TrueFalseValue | null
  readonly explanation?: string
  readonly onSelect?: (value: TrueFalseValue) => void
  readonly statement: string
}) {
  const [selected, setSelected] = useState<TrueFalseValue | null>(
    defaultSelected
  )

  return (
    <>
      <StepHeader>
        <StepTitle>
          <h2>참인지 거짓인지 판단하세요</h2>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <p className="text-base leading-7 text-pretty text-foreground">
          {statement}
        </p>
        <ChoiceGroup aria-label="참 또는 거짓" type="single">
          {OPTIONS.map((option) => {
            const isSelected = selected === option.value
            const state: ChoiceState =
              checked === false
                ? isSelected
                  ? "selected"
                  : "idle"
                : option.value === correctAnswer
                  ? "correct"
                  : isSelected
                    ? "incorrect"
                    : "locked"

            return (
              <Choice
                key={option.id}
                mode="single"
                onClick={() => {
                  if (checked === false) {
                    setSelected(option.value)
                    onSelect?.(option.value)
                  }
                }}
                selected={isSelected}
                state={state}
              >
                <ChoiceContent>
                  <ChoiceLabel>{option.label}</ChoiceLabel>
                </ChoiceContent>
              </Choice>
            )
          })}
        </ChoiceGroup>
        {checked !== false && explanation ? (
          <Insight tone="think">
            <InsightEyebrow>해설</InsightEyebrow>
            <InsightDescription>{explanation}</InsightDescription>
          </Insight>
        ) : null}
      </StepBody>
    </>
  )
}
