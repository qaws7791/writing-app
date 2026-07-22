"use client"

import { useCallback, type ReactNode } from "react"

import type {
  LessonAiFeedbackOutcome,
  LessonAiFeedbackRequest,
  LessonAnswerChange,
  LessonStepAnswerPayload,
} from "@/features/lesson-session/model/lesson-logic"
import { LessonMatchAnswer } from "@/features/lesson-session/ui/lesson-match-answer"
import { LessonAiFeedbackAnswer } from "@/features/lesson-session/ui/lesson-ai-feedback-answer"
import { LessonWriteAnswer } from "@/features/lesson-session/ui/lesson-write-answer"
import type { LessonStepCheckedState } from "@/features/lesson-session/model/lesson-step-policy"
import {
  findLessonStepItemId,
  getCorrectLessonStepItemIds,
  getLessonStepEvaluationExplanation,
  mapLessonStepTextsToItemIds,
  toLessonStepCheckedVisual,
} from "@/features/lesson-session/model/lesson-step-presentation"
import { CategorizeAnswer } from "@workspace/ui/components/lesson/categorize-answer"
import { CompareStepView } from "@workspace/ui/components/lesson/compare-step-view"
import { FillBlankAnswer } from "@workspace/ui/components/lesson/fill-blank-answer"
import { LessonStepFrame } from "@workspace/ui/components/lesson/lesson-step-frame"
import { MultipleChoiceAnswer } from "@workspace/ui/components/lesson/multiple-choice-answer"
import { OrderAnswer } from "@workspace/ui/components/lesson/order-answer"
import { ReadingStepView } from "@workspace/ui/components/lesson/reading-step-view"
import { SelectAnswer } from "@workspace/ui/components/lesson/select-answer"
import type { LearnerLessonStep as LessonStep } from "@workspace/contracts/learning/learner-content"

export type LessonStepRendererProps = {
  readonly answerError?: null | string
  readonly checked?: LessonStepCheckedState | false
  readonly learnerId: string
  readonly onAiFeedbackRequest?: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackOutcome>
  readonly onAnswerChange?: (change: LessonAnswerChange) => Promise<void> | void
  readonly onAnswerPayloadChange?: (change: {
    readonly payload: LessonStepAnswerPayload
    readonly stepId: string
  }) => void
  readonly step: LessonStep
}

export function LessonStepRenderer({
  answerError,
  checked = false,
  learnerId,
  onAiFeedbackRequest,
  onAnswerChange,
  onAnswerPayloadChange,
  step,
}: LessonStepRendererProps) {
  const emitAnswer = useCallback(
    (payload: LessonStepAnswerPayload) => {
      onAnswerPayloadChange?.({ payload, stepId: step.id })
      void onAnswerChange?.({ answer: payload, stepId: step.id })
    },
    [onAnswerChange, onAnswerPayloadChange, step.id]
  )

  return (
    <LessonStepFrame
      {...(answerError === undefined ? {} : { answerError })}
      stepId={step.id}
    >
      {renderStep(step, checked, learnerId, emitAnswer, onAiFeedbackRequest)}
    </LessonStepFrame>
  )
}

function renderStep(
  step: LessonStep,
  checked: LessonStepCheckedState | false,
  learnerId: string,
  emitAnswer: (payload: LessonStepAnswerPayload) => void,
  onAiFeedbackRequest: LessonStepRendererProps["onAiFeedbackRequest"]
): ReactNode {
  const checkedVisual = toLessonStepCheckedVisual(step, checked)

  switch (step.type) {
    case "READING":
      return (
        <ReadingStepView
          body={step.body}
          guide={step.guide}
          {...(step.source === undefined ? {} : { source: step.source })}
          title={step.title}
        />
      )
    case "COMPARE":
      return (
        <CompareStepView
          analysis=""
          title={step.title}
          versions={step.versions}
        />
      )
    case "MULTIPLE_CHOICE":
      return (
        <MultipleChoiceAnswer
          checked={checkedVisual}
          correctOptionId={getCorrectLessonStepItemIds(checked)[0] ?? ""}
          onSelect={(selectedOptionId) =>
            emitAnswer({
              selectedOptionId: findLessonStepItemId(
                step.options,
                selectedOptionId
              ),
              type: "MULTIPLE_CHOICE",
            })
          }
          options={step.options}
          question={step.question}
        />
      )
    case "FILL_BLANK":
      return (
        <FillBlankAnswer
          blankCount={step.blankCount}
          checked={checkedVisual}
          onChange={(selectedWords) =>
            emitAnswer({
              selectedChoiceIds: mapLessonStepTextsToItemIds(
                step.choices,
                selectedWords
              ),
              type: "FILL_BLANK",
            })
          }
          template={step.template}
          words={step.choices.map((choice) => choice.text)}
        />
      )
    case "SELECT": {
      const correctItemIds = new Set(getCorrectLessonStepItemIds(checked))
      return (
        <SelectAnswer
          checked={checkedVisual}
          correctIndexes={step.items.flatMap((item, index) =>
            correctItemIds.has(item.id) ? [index] : []
          )}
          explanation={getLessonStepEvaluationExplanation(checked)}
          {...(step.layout === undefined ? {} : { layout: step.layout })}
          onChange={(selectedIndexes) =>
            emitAnswer({
              selectedItemIds: selectedIndexes.flatMap((index) => {
                const item = step.items[index]
                return item === undefined ? [] : [item.id]
              }),
              type: "SELECT",
            })
          }
          question={step.question}
          segments={step.items.map((item) => item.text)}
        />
      )
    }
    case "ORDER": {
      const itemById = new Map(step.items.map((item) => [item.id, item.text]))
      return (
        <OrderAnswer
          checked={checkedVisual}
          correctItems={getCorrectLessonStepItemIds(checked).flatMap((id) => {
            const text = itemById.get(id)
            return text === undefined ? [] : [text]
          })}
          explanation={getLessonStepEvaluationExplanation(checked)}
          items={step.items.map((item) => item.text)}
          onChange={(orderedItems) =>
            emitAnswer({
              orderedItemIds: mapLessonStepTextsToItemIds(
                step.items,
                orderedItems
              ),
              type: "ORDER",
            })
          }
          seed={step.id}
          {...(step.showNumbers === undefined
            ? {}
            : { showNumbers: step.showNumbers })}
          title={step.title}
        />
      )
    }
    case "MATCH": {
      const evaluatedPairs =
        checked !== false && checked.type === "MATCH"
          ? step.leftItems.map((leftItem, index) => {
              const evaluatedItem = checked.items.find(
                (item) => item.leftItemId === leftItem.id
              )
              const expectedRightItem = step.rightItems.find(
                (item) => item.id === evaluatedItem?.expectedRightItemId
              )
              const fallbackRightItem = step.rightItems[index]

              return {
                left: leftItem,
                right: expectedRightItem ??
                  fallbackRightItem ?? {
                    id: `missing-right-${index}`,
                    text: "",
                  },
              }
            })
          : step.leftItems.map((leftItem, index) => {
              const rightItem = step.rightItems[index]

              return {
                left: leftItem,
                right: rightItem ?? {
                  id: `missing-right-${index}`,
                  text: "",
                },
              }
            })

      return (
        <LessonMatchAnswer
          checked={checkedVisual}
          explanation={getLessonStepEvaluationExplanation(checked)}
          guide={step.guide}
          key={step.id}
          onChange={(pairs) =>
            emitAnswer({
              pairs: pairs.map((pair) => ({
                leftItemId: findLessonStepItemId(
                  step.leftItems,
                  pair.leftItemId
                ),
                rightItemId: findLessonStepItemId(
                  step.rightItems,
                  pair.rightItemId
                ),
              })),
              type: "MATCH",
            })
          }
          pairs={evaluatedPairs}
          title={step.title}
        />
      )
    }
    case "CATEGORIZE": {
      const expectedCategoryByItemId =
        checked !== false && checked.type === "CATEGORIZE"
          ? new Map(
              checked.items.map((item) => [
                item.itemId,
                item.expectedCategoryId,
              ])
            )
          : new Map<string, string>()
      return (
        <CategorizeAnswer
          categories={step.categories.map((category) => ({
            id: category.id,
            label: category.text,
          }))}
          checked={checkedVisual}
          explanation={getLessonStepEvaluationExplanation(checked)}
          guide={step.guide}
          items={step.items.map((item) => ({
            categoryId: expectedCategoryByItemId.get(item.id) ?? "",
            id: item.id,
            text: item.text,
          }))}
          onChange={(assignments) =>
            emitAnswer({
              assignments: assignments.map((assignment) => ({
                categoryId: findLessonStepItemId(
                  step.categories,
                  assignment.categoryId
                ),
                itemId: findLessonStepItemId(step.items, assignment.itemId),
              })),
              type: "CATEGORIZE",
            })
          }
          title={step.title}
        />
      )
    }
    case "WRITE": {
      return (
        <LessonWriteAnswer
          checked={checkedVisual}
          emitAnswer={emitAnswer}
          key={JSON.stringify([learnerId, step.id])}
          learnerId={learnerId}
          step={step}
        />
      )
    }
    case "AI_FEEDBACK":
      return (
        <LessonAiFeedbackAnswer
          key={JSON.stringify([learnerId, step.target])}
          learnerId={learnerId}
          {...(onAiFeedbackRequest === undefined
            ? {}
            : { onAiFeedbackRequest })}
          step={step}
        />
      )
  }
}
