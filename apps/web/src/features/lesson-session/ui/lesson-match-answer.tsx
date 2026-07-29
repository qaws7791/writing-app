"use client"

import { useMemo, useState } from "react"

import {
  createMatchInteractionState,
  createMatchStepPresentation,
  findMatchChoice,
  toMatchAnswerConnections,
  toMatchAnswerPairs,
  transitionMatchChoiceSelection,
  type MatchAnswerPair,
  type MatchEvaluationItemInput,
  type MatchStepPresentationInput,
} from "@/features/lesson-session/model/lesson-match-presentation"
import { MatchAnswer } from "@workspace/ui/components/lesson/match-answer"
import type { MatchAnswerChoiceSelection } from "@workspace/ui/components/lesson/match-answer"
import type { LessonStepCheckedVisual } from "@workspace/ui/lib/lesson-step-checked-visual"

export function LessonMatchAnswer({
  checked,
  evaluationItems,
  explanation,
  guide,
  initialPairs = [],
  leftItems,
  onChange,
  rightItems,
  title,
}: {
  readonly checked: LessonStepCheckedVisual
  readonly evaluationItems?: readonly MatchEvaluationItemInput[]
  readonly explanation?: string
  readonly guide: string
  readonly initialPairs?: readonly Readonly<{
    leftItemId: string
    rightItemId: string
  }>[]
  readonly leftItems: MatchStepPresentationInput["leftItems"]
  readonly onChange: (pairs: readonly MatchAnswerPair[]) => void
  readonly rightItems: MatchStepPresentationInput["rightItems"]
  readonly title: string
}) {
  const presentation = useMemo(
    () => createMatchStepPresentation({ leftItems, rightItems }),
    [leftItems, rightItems]
  )
  const [interaction, setInteraction] = useState(() =>
    createMatchInteractionState(presentation, initialPairs)
  )
  const connections = toMatchAnswerConnections(
    presentation,
    interaction.selectionMap,
    evaluationItems
  )

  function handleChoiceSelect(selection: MatchAnswerChoiceSelection) {
    if (checked !== false) return

    const choice = findMatchChoice(presentation, selection)

    if (choice === undefined) {
      throw new Error(`알 수 없는 매칭 선택지입니다: ${selection.id}`)
    }

    const transition = transitionMatchChoiceSelection(interaction, {
      id: choice.id,
      side: selection.side,
    })

    setInteraction(transition.state)

    if (transition.type === "answer-changed") {
      onChange(toMatchAnswerPairs(presentation, transition.state.selectionMap))
    }
  }

  return (
    <MatchAnswer
      checked={checked}
      connections={connections}
      {...(explanation === undefined ? {} : { explanation })}
      guide={guide}
      leftChoices={presentation.leftChoices}
      onChoiceSelect={handleChoiceSelect}
      pendingChoice={interaction.pendingChoice}
      rightChoices={presentation.rightChoices}
      title={title}
    />
  )
}
