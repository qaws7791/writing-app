import { useState, useMemo } from "react"
import ReactMarkdown from "react-markdown"

import type { StepProps } from "./step-types"
import type { MatchStep } from "../lesson-types"
import {
  createMatchStepPresentation,
  findMatchedLeftChoiceIdForRightChoiceId,
  isCorrectMatchChoice,
  toMatchAnswerPairs,
  toggleMatchSelection,
  type MatchChoiceId,
  type MatchSelectionMap,
} from "../lesson-match-presentation"
import { emitAnswer } from "../utils/emit-answer"
import { ChoiceCard } from "@workspace/ui/components/ui/choice-card"
import { Surface } from "@workspace/ui/components/ui/surface"

export function MatchAnswer({
  checked,
  onAnswerChange,
  onAnswerPayloadChange,
  step,
}: StepProps<MatchStep>) {
  const [matchMap, setMatchMap] = useState<MatchSelectionMap>({})
  const [selectedLeft, setSelectedLeft] = useState<MatchChoiceId | null>(null)
  const presentation = useMemo(() => createMatchStepPresentation(step), [step])

  function handleLeftTap(leftChoiceId: MatchChoiceId) {
    if (checked !== false) {
      return
    }

    setSelectedLeft((previous) =>
      previous === leftChoiceId ? null : leftChoiceId
    )
  }

  function handleRightTap(rightChoiceId: MatchChoiceId) {
    if (checked !== false || selectedLeft === null) {
      return
    }

    const nextMap = toggleMatchSelection(matchMap, {
      leftChoiceId: selectedLeft,
      rightChoiceId,
    })

    setMatchMap(nextMap)
    emitAnswer(
      onAnswerChange,
      step.id,
      {
        pairs: toMatchAnswerPairs(presentation, nextMap),
        type: "MATCH",
      },
      onAnswerPayloadChange
    )
    setSelectedLeft(null)
  }

  return (
    <div className="an-fi">
      <h2 className="mb-2 text-heading-sm font-bold">
        {step.title || "짝을 맞춰보세요"}
      </h2>
      {step.guide ? (
        <div className="prose prose-sm max-w-none mb-6 prose-headings:font-bold prose-headings:text-charcoal prose-p:text-muted prose-p:font-medium prose-strong:text-charcoal prose-li:text-muted prose-li:font-medium prose-code:bg-surface prose-code:rounded prose-code:px-1 prose-code:text-charcoal prose-blockquote:border-primary prose-blockquote:text-muted">
          <ReactMarkdown>{step.guide}</ReactMarkdown>
        </div>
      ) : (
        <p className="mb-6 text-body-md font-medium text-muted-foreground">
          왼쪽 단어를 탭하고, 오른쪽에서 알맞은 기능을 탭해 짝을 맞추세요.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3">
          {presentation.leftChoices.map((leftChoice) => {
            const matchedRightChoiceId = matchMap[leftChoice.id]
            const isCorrect =
              checked !== false &&
              matchedRightChoiceId !== undefined &&
              isCorrectMatchChoice(
                presentation,
                leftChoice.id,
                matchedRightChoiceId
              )
            const isWrong =
              checked !== false &&
              matchedRightChoiceId !== undefined &&
              !isCorrectMatchChoice(
                presentation,
                leftChoice.id,
                matchedRightChoiceId
              )
            const isActive = selectedLeft === leftChoice.id
            const isPaired = matchedRightChoiceId !== undefined
            const state = isCorrect
              ? "correct"
              : isWrong
                ? "wrong"
                : isActive || isPaired
                  ? "selected"
                  : "idle"

            return (
              <ChoiceCard
                aria-disabled={checked !== false}
                key={leftChoice.id}
                onClick={() => handleLeftTap(leftChoice.id)}
                state={state}
              >
                {leftChoice.text}
              </ChoiceCard>
            )
          })}
        </div>
        <div className="flex flex-col gap-3">
          {presentation.rightChoices.map((rightChoice) => {
            const pairedLeftChoiceId = findMatchedLeftChoiceIdForRightChoiceId(
              matchMap,
              rightChoice.id
            )
            const isPaired = pairedLeftChoiceId !== null
            const isHighlighted =
              selectedLeft !== null && matchMap[selectedLeft] === rightChoice.id
            const isCorrect =
              checked !== false &&
              pairedLeftChoiceId !== null &&
              isCorrectMatchChoice(
                presentation,
                pairedLeftChoiceId,
                rightChoice.id
              )
            const isWrong =
              checked !== false &&
              pairedLeftChoiceId !== null &&
              !isCorrectMatchChoice(
                presentation,
                pairedLeftChoiceId,
                rightChoice.id
              )
            const state = isCorrect
              ? "correct"
              : isWrong
                ? "wrong"
                : isHighlighted || isPaired
                  ? "selected"
                  : selectedLeft === null
                    ? "disabled"
                    : "idle"

            return (
              <ChoiceCard
                aria-disabled={checked !== false || selectedLeft === null}
                key={rightChoice.id}
                onClick={() => handleRightTap(rightChoice.id)}
                state={state}
              >
                {rightChoice.text}
              </ChoiceCard>
            )
          })}
        </div>
      </div>
      {checked !== false && step.explanation ? (
        <Surface className="mt-6" size="md" variant="panel">
          <div className="mb-2 font-bold text-muted-foreground">해설</div>
          <p className="font-medium">{step.explanation}</p>
        </Surface>
      ) : null}
    </div>
  )
}
