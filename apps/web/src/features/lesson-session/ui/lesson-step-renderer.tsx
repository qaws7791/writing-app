"use client"

import Image from "next/image"
import dynamic from "next/dynamic"
import { useCallback, type ReactNode } from "react"

import type { LessonStepAnswerPayload } from "@/features/lesson-session/model/lesson-logic"
import { LessonMatchAnswer } from "@/features/lesson-session/ui/lesson-match-answer"
import type { LessonStepCheckedState } from "@/features/lesson-session/model/lesson-step-policy"
import {
  findLessonStepItemId,
  getCorrectLessonStepItemIds,
  toLessonStepCheckedVisual,
} from "@/features/lesson-session/model/lesson-step-presentation"
import { CategorizeAnswer } from "@workspace/ui/components/learning/categorize-answer"
import { CompareStepView } from "@workspace/ui/components/learning/compare-step-view"
import { ErrorCorrectAnswer } from "@workspace/ui/components/learning/error-correct-answer"
import { FillBlankAnswer } from "@workspace/ui/components/learning/fill-blank-answer"
import { LessonStepFrame } from "@workspace/ui/components/learning/lesson-step-frame"
import { MultipleChoiceAnswer } from "@workspace/ui/components/learning/multiple-choice-answer"
import { ReadingStepView } from "@workspace/ui/components/learning/reading-step-view"
import { SelectAnswer } from "@workspace/ui/components/learning/select-answer"
import { SentenceBuildAnswer } from "@workspace/ui/components/learning/sentence-build-answer"
import { TrueFalseAnswer } from "@workspace/ui/components/learning/true-false-answer"
import type { LearnerLessonStep } from "@workspace/contracts/learning/learner-content"
import type { LessonStepType } from "@workspace/contracts/content/steps"

const OrderAnswer = dynamic(() =>
  import("@workspace/ui/components/learning/order-answer").then(
    (module) => module.OrderAnswer
  )
)

export type LessonStepRendererProps = {
  readonly answerError?: null | string
  readonly answerPayload?: LessonStepAnswerPayload
  readonly checked?: LessonStepCheckedState | false
  readonly onAnswerPayloadChange?: (change: {
    readonly payload: LessonStepAnswerPayload
    readonly stepId: string
  }) => void
  readonly step: LearnerLessonStep
}

const lessonStepRendererByType = {
  CATEGORIZE: CategorizeAnswer,
  COMPARE: CompareStepView,
  ERROR_CORRECT: ErrorCorrectAnswer,
  FILL_BLANK: FillBlankAnswer,
  MATCH: LessonMatchAnswer,
  MULTIPLE_CHOICE: MultipleChoiceAnswer,
  ORDER: OrderAnswer,
  READING: ReadingStepView,
  SELECT: SelectAnswer,
  SENTENCE_BUILD: SentenceBuildAnswer,
  TRUE_FALSE: TrueFalseAnswer,
} satisfies Record<LessonStepType, unknown>

export function LessonStepRenderer({
  answerError,
  answerPayload,
  checked = false,
  onAnswerPayloadChange,
  step,
}: LessonStepRendererProps) {
  const emitAnswer = useCallback(
    (payload: LessonStepAnswerPayload) => {
      onAnswerPayloadChange?.({ payload, stepId: step.id })
    },
    [onAnswerPayloadChange, step.id]
  )

  return (
    <LessonStepFrame
      {...(answerError === undefined ? {} : { answerError })}
      stepId={step.id}
    >
      {renderStep({
        answerPayload,
        checked,
        emitAnswer,
        step,
      })}
    </LessonStepFrame>
  )
}

function renderStep({
  answerPayload,
  checked,
  emitAnswer,
  step,
}: {
  readonly answerPayload: LessonStepAnswerPayload | undefined
  readonly checked: LessonStepCheckedState | false
  readonly emitAnswer: (payload: LessonStepAnswerPayload) => void
  readonly step: LearnerLessonStep
}): ReactNode {
  const checkedVisual = toLessonStepCheckedVisual(step, checked)

  switch (step.type) {
    case "READING": {
      const StepRenderer = lessonStepRendererByType.READING
      return (
        <StepRenderer
          body={step.body}
          {...(step.illustration === undefined
            ? {}
            : {
                illustration: (
                  <Image
                    alt={step.illustration.altText}
                    className="aspect-video w-full object-cover"
                    height={675}
                    sizes="(max-width: 768px) calc(100vw - 2rem), 48rem"
                    src={step.illustration.url}
                    width={1200}
                  />
                ),
              })}
          {...(step.source === undefined ? {} : { source: step.source })}
          title={step.title}
        />
      )
    }
    case "COMPARE": {
      const StepRenderer = lessonStepRendererByType.COMPARE
      return (
        <StepRenderer
          analysis={step.analysis}
          title={step.title}
          versions={step.versions}
        />
      )
    }
    case "MULTIPLE_CHOICE": {
      const StepRenderer = lessonStepRendererByType.MULTIPLE_CHOICE
      return (
        <StepRenderer
          checked={checkedVisual}
          correctOptionId={getCorrectLessonStepItemIds(checked)[0] ?? ""}
          defaultSelectedOptionId={
            answerPayload?.type === "MULTIPLE_CHOICE"
              ? answerPayload.selectedOptionId
              : null
          }
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
    }
    case "FILL_BLANK": {
      const StepRenderer = lessonStepRendererByType.FILL_BLANK
      return (
        <StepRenderer
          blankCount={step.blankCount}
          checked={checkedVisual}
          choices={step.choices}
          defaultSelectedChoiceIds={
            answerPayload?.type === "FILL_BLANK"
              ? answerPayload.selectedChoiceIds
              : []
          }
          onChange={(selectedChoiceIds) =>
            emitAnswer({
              selectedChoiceIds: [...selectedChoiceIds],
              type: "FILL_BLANK",
            })
          }
          template={step.template}
        />
      )
    }
    case "SELECT": {
      const StepRenderer = lessonStepRendererByType.SELECT
      const correctItemIds = new Set(getCorrectLessonStepItemIds(checked))
      return (
        <StepRenderer
          checked={checkedVisual}
          correctIndexes={step.items.flatMap((item, index) =>
            correctItemIds.has(item.id) ? [index] : []
          )}
          defaultSelectedIndexes={
            answerPayload?.type === "SELECT"
              ? step.items.flatMap((item, index) =>
                  answerPayload.selectedItemIds.includes(item.id) ? [index] : []
                )
              : []
          }
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
      const StepRenderer = lessonStepRendererByType.ORDER
      return (
        <StepRenderer
          checked={checkedVisual}
          correctItemIds={getCorrectLessonStepItemIds(checked)}
          items={step.items}
          onChange={(orderedItemIds) =>
            emitAnswer({
              orderedItemIds: orderedItemIds.map((itemId) =>
                findLessonStepItemId(step.items, itemId)
              ),
              type: "ORDER",
            })
          }
          seed={step.id}
          {...(answerPayload?.type === "ORDER"
            ? { defaultOrderedItemIds: answerPayload.orderedItemIds }
            : {})}
          title={step.title}
        />
      )
    }
    case "MATCH": {
      const StepRenderer = lessonStepRendererByType.MATCH

      return (
        <StepRenderer
          checked={checkedVisual}
          {...(checked !== false && checked.evaluation?.type === "MATCH"
            ? { evaluationItems: checked.evaluation.items }
            : {})}
          initialPairs={
            answerPayload?.type === "MATCH" ? answerPayload.pairs : []
          }
          key={step.id}
          leftItems={step.leftItems}
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
          rightItems={step.rightItems}
          title={step.title}
        />
      )
    }
    case "CATEGORIZE": {
      const StepRenderer = lessonStepRendererByType.CATEGORIZE
      const expectedCategoryByItemId =
        checked !== false && checked.evaluation?.type === "CATEGORIZE"
          ? new Map(
              checked.evaluation.items.map((item) => [
                item.itemId,
                item.expectedCategoryId,
              ])
            )
          : new Map<string, string>()
      return (
        <StepRenderer
          categories={step.categories.map((category) => ({
            id: category.id,
            label: category.text,
          }))}
          checked={checkedVisual}
          defaultPlacements={
            answerPayload?.type === "CATEGORIZE"
              ? Object.fromEntries(
                  answerPayload.assignments.map((assignment) => [
                    assignment.itemId,
                    assignment.categoryId,
                  ])
                )
              : {}
          }
          items={step.items.map((item) => ({
            categoryId:
              expectedCategoryByItemId.get(item.id) ?? item.categoryId,
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
    case "TRUE_FALSE": {
      const StepRenderer = lessonStepRendererByType.TRUE_FALSE
      return (
        <StepRenderer
          checked={checkedVisual}
          correctAnswer={
            checked !== false && checked.evaluation?.type === "TRUE_FALSE"
              ? checked.evaluation.correctAnswer
              : false
          }
          defaultSelected={
            answerPayload?.type === "TRUE_FALSE"
              ? answerPayload.selectedAnswer
              : null
          }
          onSelect={(selectedAnswer) =>
            emitAnswer({ selectedAnswer, type: "TRUE_FALSE" })
          }
          prompt={step.question}
          statement={step.statement}
        />
      )
    }
    case "SENTENCE_BUILD": {
      const StepRenderer = lessonStepRendererByType.SENTENCE_BUILD
      return (
        <StepRenderer
          checked={checkedVisual}
          correctTileIds={getCorrectLessonStepItemIds(checked).map((tileId) =>
            findLessonStepItemId(step.tiles, tileId)
          )}
          defaultSelectedTileIds={
            answerPayload?.type === "SENTENCE_BUILD"
              ? answerPayload.selectedTileIds
              : []
          }
          onChange={(selectedTileIds) =>
            emitAnswer({
              selectedTileIds: [...selectedTileIds],
              type: "SENTENCE_BUILD",
            })
          }
          prompt={step.question}
          tiles={step.tiles}
        />
      )
    }
    case "ERROR_CORRECT": {
      const StepRenderer = lessonStepRendererByType.ERROR_CORRECT
      const evaluation =
        checked !== false && checked.evaluation?.type === "ERROR_CORRECT"
          ? checked.evaluation
          : null
      return (
        <StepRenderer
          checked={checkedVisual}
          correctErrorSegmentId={evaluation?.correctSegmentId ?? ""}
          correctFixId={evaluation?.correctFixId ?? ""}
          defaultErrorSegmentId={
            answerPayload?.type === "ERROR_CORRECT"
              ? answerPayload.selectedSegmentId
              : null
          }
          defaultFixId={
            answerPayload?.type === "ERROR_CORRECT"
              ? answerPayload.selectedFixId
              : null
          }
          fixes={step.fixes}
          onChange={({ errorSegmentId, fixId }) =>
            emitAnswer({
              selectedFixId:
                fixId === null ? null : findLessonStepItemId(step.fixes, fixId),
              selectedSegmentId:
                errorSegmentId === null
                  ? null
                  : findLessonStepItemId(step.segments, errorSegmentId),
              type: "ERROR_CORRECT",
            })
          }
          prompt={step.question}
          segments={step.segments}
        />
      )
    }
  }
}
