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
  type MatchStepPairInput,
} from "@/features/lesson-session/model/lesson-match-presentation"
import { MatchAnswer } from "@workspace/ui/components/lesson/match-answer"
import type { MatchAnswerChoiceSelection } from "@workspace/ui/components/lesson/match-answer"
import type { LessonStepCheckedVisual } from "@workspace/ui/components/lesson/lesson-step-checked-visual"

export function LessonMatchAnswer({
  checked,
  explanation,
  guide,
  onChange,
  pairs,
  title,
}: {
  readonly checked: LessonStepCheckedVisual
  readonly explanation?: string
  readonly guide: string
  readonly onChange: (pairs: readonly MatchAnswerPair[]) => void
  readonly pairs: readonly MatchStepPairInput[]
  readonly title: string
}) {
  const presentation = useMemo(
    () => createMatchStepPresentation({ pairs }),
    [pairs]
  )
  const [interaction, setInteraction] = useState(createMatchInteractionState)
  const connections = toMatchAnswerConnections(
    presentation,
    interaction.selectionMap,
    checked !== false
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
