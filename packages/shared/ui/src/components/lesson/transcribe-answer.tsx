"use client"

import { useState } from "react"

import {
  Compose,
  ComposeEditor,
  ComposeReference,
} from "#ui/components/ui/compose"
import {
  Insight,
  InsightDescription,
  InsightEyebrow,
} from "#ui/components/ui/insight"
import { StepBody, StepHeader, StepTitle } from "#ui/components/ui/step"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"
import { cn } from "#ui/lib/utils"

export function TranscribeAnswer({
  checked = false,
  defaultValue = "",
  explanation,
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
          <h2>{prompt ?? "아래 문장을 그대로 입력하세요"}</h2>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <Compose>
          <ComposeReference aria-label="원문">{sourceText}</ComposeReference>
          <ComposeEditor
            aria-invalid={isWrong || undefined}
            aria-label="받아쓰기 입력"
            className={cn(
              isCorrect && "border-foreground/20 bg-foreground/[0.035]",
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
        {checked !== false ? (
          <Insight tone={isCorrect ? "correct" : "incorrect"}>
            <InsightEyebrow>
              {isCorrect ? "정확히 입력했습니다" : "다시 확인해 보세요"}
            </InsightEyebrow>
            <InsightDescription>
              {explanation ? <p>{explanation}</p> : null}
              {!isCorrect ? (
                <p>
                  정답: <span className="text-foreground">{sourceText}</span>
                </p>
              ) : null}
            </InsightDescription>
          </Insight>
        ) : null}
      </StepBody>
    </>
  )
}
