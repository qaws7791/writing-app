"use client"

import Image from "next/image"
import dynamic from "next/dynamic"
import { useCallback, type ReactNode } from "react"

import type {
  LessonAiFeedbackOutcome,
  LessonAiFeedbackRequest,
  LessonAiFeedbackSkipOutcome,
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
  toLessonStepCheckedVisual,
} from "@/features/lesson-session/model/lesson-step-presentation"
import { CategorizeAnswer } from "@workspace/ui/components/lesson/categorize-answer"
import { FillBlankAnswer } from "@workspace/ui/components/lesson/fill-blank-answer"
import { LessonStepFrame } from "@workspace/ui/components/lesson/lesson-step-frame"
import { MultipleChoiceAnswer } from "@workspace/ui/components/lesson/multiple-choice-answer"
import { ReadingStepView } from "@workspace/ui/components/lesson/reading-step-view"
import { SelectAnswer } from "@workspace/ui/components/lesson/select-answer"
import type { LessonStep } from "@/features/lesson-session/model/lesson-view-model"
import type { LessonStepType } from "@workspace/contracts/content/steps"

const OrderAnswer = dynamic(() =>
  import("@workspace/ui/components/lesson/order-answer").then(
    (module) => module.OrderAnswer
  )
)

const CompareStepView = dynamic(() =>
  import("@workspace/ui/components/lesson/compare-step-view").then(
    (module) => module.CompareStepView
  )
)

export type LessonStepRendererProps = {
  readonly aiFeedbackDraftText?: string
  readonly answerError?: null | string
  readonly answerPayload?: LessonStepAnswerPayload
  readonly checked?: LessonStepCheckedState | false
  readonly onAiFeedbackRequest?: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackOutcome>
  readonly onAiFeedbackSkip?: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackSkipOutcome>
  readonly onAnswerPayloadChange?: (change: {
    readonly payload: LessonStepAnswerPayload
    readonly stepId: string
  }) => void
  readonly step: LessonStep
}

const lessonStepRendererByType = {
  AI_FEEDBACK: LessonAiFeedbackAnswer,
  CATEGORIZE: CategorizeAnswer,
  COMPARE: CompareStepView,
  FILL_BLANK: FillBlankAnswer,
  MATCH: LessonMatchAnswer,
  MULTIPLE_CHOICE: MultipleChoiceAnswer,
  ORDER: OrderAnswer,
  READING: ReadingStepView,
  SELECT: SelectAnswer,
  WRITE: LessonWriteAnswer,
} satisfies Record<LessonStepType, unknown>

export function LessonStepRenderer({
  aiFeedbackDraftText = "",
  answerError,
  answerPayload,
  checked = false,
  onAiFeedbackRequest,
  onAiFeedbackSkip,
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
        aiFeedbackDraftText,
        answerPayload,
        checked,
        emitAnswer,
        onAiFeedbackRequest,
        onAiFeedbackSkip,
        step,
      })}
    </LessonStepFrame>
  )
}

function renderStep({
  aiFeedbackDraftText,
  answerPayload,
  checked,
  emitAnswer,
  onAiFeedbackRequest,
  onAiFeedbackSkip,
  step,
}: {
  readonly aiFeedbackDraftText: string
  readonly answerPayload: LessonStepAnswerPayload | undefined
  readonly checked: LessonStepCheckedState | false
  readonly emitAnswer: (payload: LessonStepAnswerPayload) => void
  readonly onAiFeedbackRequest: LessonStepRendererProps["onAiFeedbackRequest"]
  readonly onAiFeedbackSkip: LessonStepRendererProps["onAiFeedbackSkip"]
  readonly step: LessonStep
}): ReactNode {
  const checkedVisual = toLessonStepCheckedVisual(step, checked)

  switch (step.type) {
    case "READING": {
      const StepRenderer = lessonStepRendererByType.READING
      return (
        <StepRenderer
          body={step.body}
          guide={step.guide}
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
        <StepRenderer analysis="" title={step.title} versions={step.versions} />
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
      const StepRenderer = lessonStepRendererByType.ORDER
      return (
        <StepRenderer
          checked={checkedVisual}
          correctItemIds={getCorrectLessonStepItemIds(checked)}
          explanation={getLessonStepEvaluationExplanation(checked)}
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
          {...(step.showNumbers === undefined
            ? {}
            : { showNumbers: step.showNumbers })}
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
          {...(checked !== false && checked.type === "MATCH"
            ? { evaluationItems: checked.items }
            : {})}
          explanation={getLessonStepEvaluationExplanation(checked)}
          guide={step.guide}
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
        checked !== false && checked.type === "CATEGORIZE"
          ? new Map(
              checked.items.map((item) => [
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
      const StepRenderer = lessonStepRendererByType.WRITE
      return (
        <StepRenderer
          checked={checkedVisual}
          emitAnswer={emitAnswer}
          step={step}
          text={answerPayload?.type === "WRITE" ? answerPayload.text : ""}
        />
      )
    }
    case "AI_FEEDBACK": {
      const StepRenderer = lessonStepRendererByType.AI_FEEDBACK
      return (
        <StepRenderer
          draftText={aiFeedbackDraftText}
          {...(onAiFeedbackRequest === undefined
            ? {}
            : { onAiFeedbackRequest })}
          {...(onAiFeedbackSkip === undefined ? {} : { onAiFeedbackSkip })}
          step={step}
        />
      )
    }
  }
}
