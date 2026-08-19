"use client"

import { useState } from "react"

import {
  Segment,
  SegmentGroup,
  type SegmentState,
} from "#ui/components/learning/segment"
import { StepBody, StepHeader, StepTitle } from "#ui/components/learning/step"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"

export function SelectAnswer({
  checked = false,
  correctIndexes,
  defaultSelectedIndexes = [],
  explanation: _explanation,
  layout,
  onChange,
  question,
  segments,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly correctIndexes: readonly number[]
  readonly defaultSelectedIndexes?: readonly number[]
  readonly explanation?: string
  readonly layout?: string
  readonly onChange?: (selectedIndexes: readonly number[]) => void
  readonly question: string
  readonly segments: readonly string[]
}) {
  const [selectedIndexes, setSelectedIndexes] = useState<readonly number[]>(
    defaultSelectedIndexes
  )
  const isBlock = layout === "block"

  return (
    <>
      <StepHeader>
        <StepTitle>
          <h1>{question}</h1>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <SegmentGroup
          aria-label={question}
          layout={isBlock ? "block" : "inline"}
        >
          {segments.map((segment, index) => {
            const isSelected = selectedIndexes.includes(index)
            const isCorrect = correctIndexes.includes(index)
            const state: SegmentState =
              checked === false
                ? isSelected
                  ? "selected"
                  : "idle"
                : isCorrect && isSelected
                  ? "correct"
                  : isCorrect
                    ? "missed"
                    : isSelected
                      ? "incorrect"
                      : "locked"

            return (
              <Segment
                disabled={checked !== false}
                key={`${segment}-${index}`}
                layout={isBlock ? "block" : "inline"}
                onClick={() => {
                  if (checked === false) {
                    const nextIndexes = selectedIndexes.includes(index)
                      ? selectedIndexes.filter((value) => value !== index)
                      : [...selectedIndexes, index]
                    setSelectedIndexes(nextIndexes)
                    onChange?.(nextIndexes)
                  }
                }}
                selected={isSelected}
                state={state}
              >
                {segment}
              </Segment>
            )
          })}
        </SegmentGroup>
      </StepBody>
    </>
  )
}
