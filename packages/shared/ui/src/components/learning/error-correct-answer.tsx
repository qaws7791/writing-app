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
  Segment,
  SegmentGroup,
  type SegmentState,
} from "#ui/components/learning/segment"
import { StepBody, StepHeader, StepTitle } from "#ui/components/learning/step"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"

export type ErrorCorrectSegment = {
  readonly id: string
  readonly text: string
}

export type ErrorCorrectFix = {
  readonly id: string
  readonly text: string
}

export function ErrorCorrectAnswer({
  checked = false,
  correctErrorSegmentId,
  correctFixId,
  defaultErrorSegmentId = null,
  defaultFixId = null,
  explanation: _explanation,
  fixes,
  onChange,
  prompt,
  segments,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly correctErrorSegmentId: string
  readonly correctFixId: string
  readonly defaultErrorSegmentId?: string | null
  readonly defaultFixId?: string | null
  readonly explanation?: string
  readonly fixes: readonly ErrorCorrectFix[]
  readonly onChange?: (value: {
    readonly errorSegmentId: string | null
    readonly fixId: string | null
  }) => void
  readonly prompt?: string
  readonly segments: readonly ErrorCorrectSegment[]
}) {
  const [errorSegmentId, setErrorSegmentId] = useState<string | null>(
    defaultErrorSegmentId
  )
  const [fixId, setFixId] = useState<string | null>(defaultFixId)

  function emitChange(nextErrorId: string | null, nextFixId: string | null) {
    onChange?.({ errorSegmentId: nextErrorId, fixId: nextFixId })
  }

  function handleSegmentClick(segmentId: string) {
    if (checked !== false) return

    const nextErrorId = errorSegmentId === segmentId ? null : segmentId
    setErrorSegmentId(nextErrorId)
    setFixId(null)
    emitChange(nextErrorId, null)
  }

  function handleFixClick(nextFixId: string) {
    if (checked !== false || errorSegmentId === null) return

    setFixId(nextFixId)
    emitChange(errorSegmentId, nextFixId)
  }

  function segmentState(segmentId: string): SegmentState {
    const isSelected = errorSegmentId === segmentId
    if (checked === false) return isSelected ? "selected" : "idle"

    const isCorrect = segmentId === correctErrorSegmentId
    if (isCorrect && isSelected) return "correct"
    if (isCorrect && !isSelected) return "missed"
    if (!isCorrect && isSelected) return "incorrect"
    return "locked"
  }

  function fixState(optionId: string): ChoiceState {
    const isSelected = fixId === optionId
    if (checked === false) return isSelected ? "selected" : "idle"
    if (optionId === correctFixId) return "correct"
    if (isSelected) return "incorrect"
    return "locked"
  }

  return (
    <>
      <StepHeader>
        <StepTitle>
          <h2>{prompt ?? "오류를 찾아 올바르게 고치세요"}</h2>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            1. 오류가 있는 구간을 고르세요
          </p>
          <SegmentGroup aria-label="오류 구간" layout="inline">
            {segments.map((segment) => (
              <Segment
                disabled={checked !== false}
                intent="fault"
                key={segment.id}
                onClick={() => handleSegmentClick(segment.id)}
                selected={errorSegmentId === segment.id}
                state={segmentState(segment.id)}
              >
                {segment.text}
              </Segment>
            ))}
          </SegmentGroup>
        </div>
        {errorSegmentId !== null ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              2. 알맞은 교정안을 고르세요
            </p>
            <ChoiceGroup aria-label="교정안" type="single">
              {fixes.map((fix) => (
                <Choice
                  disabled={checked !== false}
                  key={fix.id}
                  mode="single"
                  onClick={() => handleFixClick(fix.id)}
                  selected={fixId === fix.id}
                  state={fixState(fix.id)}
                >
                  <ChoiceContent>
                    <ChoiceLabel>{fix.text}</ChoiceLabel>
                  </ChoiceContent>
                </Choice>
              ))}
            </ChoiceGroup>
          </div>
        ) : null}
      </StepBody>
    </>
  )
}
