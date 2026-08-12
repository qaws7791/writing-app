"use client"

import { useState } from "react"

import {
  Insight,
  InsightDescription,
  InsightEyebrow,
} from "#ui/components/learning/insight"
import { StepBody, StepHeader, StepTitle } from "#ui/components/learning/step"
import {
  Verdict,
  VerdictClaim,
  VerdictOption,
  type VerdictState,
} from "#ui/components/learning/verdict"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"

export type TrueFalseValue = boolean

const OPTIONS = [
  { kind: "true" as const, value: true },
  { kind: "false" as const, value: false },
]

export function TrueFalseAnswer({
  checked = false,
  correctAnswer,
  defaultSelected = null,
  explanation,
  onSelect,
  prompt,
  statement,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly correctAnswer: TrueFalseValue
  readonly defaultSelected?: TrueFalseValue | null
  readonly explanation?: string
  readonly onSelect?: (value: TrueFalseValue) => void
  readonly prompt?: string
  readonly statement: string
}) {
  const [selected, setSelected] = useState<TrueFalseValue | null>(
    defaultSelected
  )

  return (
    <>
      <StepHeader>
        <StepTitle>
          <h2>{prompt ?? "참인지 거짓인지 판단하세요"}</h2>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <div className="flex flex-col gap-8">
          <VerdictClaim>{statement}</VerdictClaim>
          <Verdict aria-label="참 또는 거짓">
            {OPTIONS.map((option) => {
              const isSelected = selected === option.value
              const state: VerdictState =
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
                <VerdictOption
                  key={option.kind}
                  kind={option.kind}
                  onClick={() => {
                    if (checked === false) {
                      setSelected(option.value)
                      onSelect?.(option.value)
                    }
                  }}
                  selected={isSelected}
                  state={state}
                />
              )
            })}
          </Verdict>
        </div>
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
