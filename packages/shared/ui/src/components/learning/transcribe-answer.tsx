"use client"

import { useState } from "react"

import {
  Compose,
  ComposeEditor,
  ComposeReference,
} from "#ui/components/learning/compose"
import { StepBody, StepHeader, StepTitle } from "#ui/components/learning/step"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"
import { cn } from "#ui/lib/utils"

export function TranscribeAnswer({
  checked = false,
  defaultValue = "",
  explanation: _explanation,
  onChange,
  prompt,
  sourceText,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly defaultValue?: string
  readonly explanation?: string
  readonly onChange?: (value: string) => void
  readonly prompt?: string
  readonly sourceText: string
}) {
  const [value, setValue] = useState(defaultValue)
  const isCorrect = checked === "correct"
  const isWrong = checked === "wrong" || (checked !== false && !isCorrect)

  return (
    <>
      <StepHeader>
        <StepTitle>
          <h1>{prompt ?? "아래 문장을 그대로 입력하세요"}</h1>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <Compose>
          <ComposeReference aria-label="원문">{sourceText}</ComposeReference>
          <ComposeEditor
            aria-invalid={isWrong || undefined}
            aria-label="받아쓰기 입력"
            className={cn(
              isCorrect && "border-success/30 bg-success/10",
              isWrong && "border-destructive/30 bg-destructive/6"
            )}
            disabled={checked !== false}
            onChange={(event) => {
              const next = event.target.value
              setValue(next)
              onChange?.(next)
            }}
            placeholder="원문을 그대로 입력하세요"
            value={value}
          />
        </Compose>
      </StepBody>
    </>
  )
}
