"use client"

import { MarkdownContent } from "#ui/components/learning/markdown-content"
import {
  Insight,
  InsightDescription,
  InsightEyebrow,
} from "#ui/components/learning/insight"
import {
  PairBoard,
  PairColumn,
  PairConnections,
  PairItem,
  PairLabel,
  PairMarker,
  type PairState,
} from "#ui/components/learning/pair"
import { StepBody, StepHeader, StepTitle } from "#ui/components/learning/step"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"

export type MatchAnswerChoice = {
  readonly id: string
  readonly text: string
}

export type MatchAnswerChoiceSelection = {
  readonly id: string
  readonly side: "left" | "right"
}

export type MatchAnswerConnection = {
  readonly leftChoiceId: string
  readonly rightChoiceId: string
  readonly tone: "correct" | "default" | "wrong"
}

function getPairState({
  checked,
  isActive,
  isPaired,
  tone,
}: {
  readonly checked: LessonStepCheckedVisual
  readonly isActive: boolean
  readonly isPaired: boolean
  readonly tone?: MatchAnswerConnection["tone"]
}): PairState {
  if (checked !== false) {
    if (tone === "correct") return "correct"
    if (tone === "wrong") return "incorrect"
    return isPaired ? "paired" : "locked"
  }

  if (isActive) return "active"
  if (isPaired) return "paired"
  return "idle"
}

export function MatchAnswer({
  checked = false,
  connections,
  explanation,
  guide,
  leftChoices,
  onChoiceSelect,
  pendingChoice = null,
  rightChoices,
  title,
}: {
  readonly checked?: LessonStepCheckedVisual
  readonly connections: readonly MatchAnswerConnection[]
  readonly explanation?: string
  readonly guide: string
  readonly leftChoices: readonly MatchAnswerChoice[]
  readonly onChoiceSelect?: (selection: MatchAnswerChoiceSelection) => void
  readonly pendingChoice?: MatchAnswerChoiceSelection | null
  readonly rightChoices: readonly MatchAnswerChoice[]
  readonly title: string
}) {
  const pairLabels = Object.fromEntries([
    ...leftChoices.map((choice) => [`left:${choice.id}`, choice.text] as const),
    ...rightChoices.map(
      (choice) => [`right:${choice.id}`, choice.text] as const
    ),
  ])

  return (
    <>
      <StepHeader>
        <StepTitle>
          <h2>{title || "짝을 맞춰보세요"}</h2>
        </StepTitle>
        {guide ? (
          <MarkdownContent className="text-sm leading-6 text-muted-foreground [&_p]:leading-6">
            {guide}
          </MarkdownContent>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            양쪽 항목을 차례로 선택해 짝을 맞추세요. 같은 항목을 다시 선택하면
            선택을 취소할 수 있습니다.
          </p>
        )}
      </StepHeader>
      <StepBody>
        <PairBoard>
          <PairConnections
            connections={connections.map((connection) => ({
              from: `left:${connection.leftChoiceId}`,
              state:
                connection.tone === "default"
                  ? "paired"
                  : connection.tone === "wrong"
                    ? "incorrect"
                    : "correct",
              to: `right:${connection.rightChoiceId}`,
            }))}
            labels={pairLabels}
          />
          <PairColumn aria-label="왼쪽 선택지" role="group" side="left">
            {leftChoices.map((choice) => {
              const connection = connections.find(
                (candidate) => candidate.leftChoiceId === choice.id
              )
              const isActive =
                pendingChoice?.side === "left" && pendingChoice.id === choice.id

              return (
                <PairChoiceButton
                  checked={checked}
                  choice={choice}
                  isActive={isActive}
                  isPaired={connection !== undefined}
                  key={choice.id}
                  {...(onChoiceSelect === undefined ? {} : { onChoiceSelect })}
                  side="left"
                  {...(connection === undefined
                    ? {}
                    : { tone: connection.tone })}
                />
              )
            })}
          </PairColumn>
          <PairColumn aria-label="오른쪽 선택지" role="group" side="right">
            {rightChoices.map((choice) => {
              const connection = connections.find(
                (candidate) => candidate.rightChoiceId === choice.id
              )
              const isActive =
                pendingChoice?.side === "right" &&
                pendingChoice.id === choice.id

              return (
                <PairChoiceButton
                  checked={checked}
                  choice={choice}
                  isActive={isActive}
                  isPaired={connection !== undefined}
                  key={choice.id}
                  {...(onChoiceSelect === undefined ? {} : { onChoiceSelect })}
                  side="right"
                  {...(connection === undefined
                    ? {}
                    : { tone: connection.tone })}
                />
              )
            })}
          </PairColumn>
        </PairBoard>
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

function PairChoiceButton({
  checked,
  choice,
  isActive,
  isPaired,
  onChoiceSelect,
  side,
  tone,
}: {
  readonly checked: LessonStepCheckedVisual
  readonly choice: MatchAnswerChoice
  readonly isActive: boolean
  readonly isPaired: boolean
  readonly onChoiceSelect?: (selection: MatchAnswerChoiceSelection) => void
  readonly side: "left" | "right"
  readonly tone?: MatchAnswerConnection["tone"]
}) {
  return (
    <PairItem
      aria-pressed={isActive || isPaired}
      data-choice-id={choice.id}
      data-side={side}
      disabled={checked !== false}
      onClick={() => onChoiceSelect?.({ id: choice.id, side })}
      pairId={`${side}:${choice.id}`}
      state={getPairState({
        checked,
        isActive,
        isPaired,
        ...(tone === undefined ? {} : { tone }),
      })}
    >
      <PairMarker />
      <PairLabel>{choice.text}</PairLabel>
    </PairItem>
  )
}
