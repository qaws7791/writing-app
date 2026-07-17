"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"

import {
  readLessonDraftText,
  subscribeToLessonDraftText,
  writeLessonDraftText,
} from "@/features/lessons/lesson-draft-storage"
import type {
  LessonAiFeedbackOutcome,
  LessonAiFeedbackRequest,
  LessonAnswerChange,
  LessonStepAnswerPayload,
} from "@/features/lessons/lesson-logic"
import { LessonMatchAnswer } from "@/features/lessons/lesson-match-answer"
import type { LessonStepCheckedState } from "@/features/lessons/lesson-step-policy"
import { AiFeedbackAnswer } from "@workspace/ui/components/lesson/ai-feedback-answer"
import { CategorizeAnswer } from "@workspace/ui/components/lesson/categorize-answer"
import { CompareStepView } from "@workspace/ui/components/lesson/compare-step-view"
import { FillBlankAnswer } from "@workspace/ui/components/lesson/fill-blank-answer"
import { LessonStepFrame } from "@workspace/ui/components/lesson/lesson-step-frame"
import { MultipleChoiceAnswer } from "@workspace/ui/components/lesson/multiple-choice-answer"
import { OrderAnswer } from "@workspace/ui/components/lesson/order-answer"
import { ReadingStepView } from "@workspace/ui/components/lesson/reading-step-view"
import { SelectAnswer } from "@workspace/ui/components/lesson/select-answer"
import { WriteAnswer } from "@workspace/ui/components/lesson/write-answer"
import type { LessonStepCheckedVisual } from "@workspace/ui/components/lesson/lesson-step-checked-visual"
import type {
  LearnerLessonStep as LessonStep,
  LessonStepItemId,
} from "@workspace/contracts/learning"

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
    <LessonStepFrame answerError={answerError} stepId={step.id}>
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
  const checkedVisual = toCheckedVisual(step, checked)

  switch (step.type) {
    case "READING":
      return (
        <ReadingStepView
          body={step.body}
          guide={step.guide}
          source={step.source}
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
          correctOptionId={getCorrectItemIds(checked)[0] ?? ""}
          onSelect={(selectedOptionId) =>
            emitAnswer({
              selectedOptionId: findItemIdById(step.options, selectedOptionId),
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
              selectedChoiceIds: mapTextsToItemIds(step.choices, selectedWords),
              type: "FILL_BLANK",
            })
          }
          template={step.template}
          words={step.choices.map((choice) => choice.text)}
        />
      )
    case "SELECT": {
      const correctItemIds = new Set(getCorrectItemIds(checked))
      return (
        <SelectAnswer
          checked={checkedVisual}
          correctIndexes={step.items.flatMap((item, index) =>
            correctItemIds.has(item.id) ? [index] : []
          )}
          explanation={getEvaluationExplanation(checked)}
          layout={step.layout}
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
          correctItems={getCorrectItemIds(checked).flatMap((id) => {
            const text = itemById.get(id)
            return text === undefined ? [] : [text]
          })}
          explanation={getEvaluationExplanation(checked)}
          items={step.items.map((item) => item.text)}
          onChange={(orderedItems) =>
            emitAnswer({
              orderedItemIds: mapTextsToItemIds(step.items, orderedItems),
              type: "ORDER",
            })
          }
          seed={step.id}
          showNumbers={step.showNumbers}
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
          explanation={getEvaluationExplanation(checked)}
          guide={step.guide}
          key={step.id}
          onChange={(pairs) =>
            emitAnswer({
              pairs: pairs.map((pair) => ({
                leftItemId: findItemIdById(step.leftItems, pair.leftItemId),
                rightItemId: findItemIdById(step.rightItems, pair.rightItemId),
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
          explanation={getEvaluationExplanation(checked)}
          guide={step.guide}
          items={step.items.map((item) => ({
            categoryId: expectedCategoryByItemId.get(item.id) ?? "",
            id: item.id,
            text: item.text,
          }))}
          onChange={(assignments) =>
            emitAnswer({
              assignments: assignments.map((assignment) => ({
                categoryId: findItemIdById(
                  step.categories,
                  assignment.categoryId
                ),
                itemId: findItemIdById(step.items, assignment.itemId),
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
          onAiFeedbackRequest={onAiFeedbackRequest}
          step={step}
        />
      )
  }
}

type WriteLessonStep = Extract<LessonStep, { readonly type: "WRITE" }>

function LessonWriteAnswer({
  checked,
  emitAnswer,
  learnerId,
  step,
}: {
  readonly checked: LessonStepCheckedVisual
  readonly emitAnswer: (payload: LessonStepAnswerPayload) => void
  readonly learnerId: string
  readonly step: WriteLessonStep
}) {
  const storedDraftText = useLessonDraftText(learnerId, step.id)
  const [editedText, setEditedText] = useState<null | string>(null)
  const emittedRestoredText = useRef<null | string>(null)
  const text = editedText ?? storedDraftText

  useEffect(() => {
    if (
      editedText !== null ||
      storedDraftText === "" ||
      emittedRestoredText.current === storedDraftText
    ) {
      return
    }

    emittedRestoredText.current = storedDraftText
    emitAnswer({ text: storedDraftText, type: "WRITE" })
  }, [editedText, emitAnswer, storedDraftText])

  return (
    <WriteAnswer
      badge={step.badge}
      checked={checked}
      claim={step.claim}
      draft={step.draft}
      goal={step.goal}
      guide={step.guide ?? step.context}
      max={step.max}
      min={step.min}
      onChange={(text) => {
        setEditedText(text)
        writeLessonDraftText(learnerId, step.id, text)
        emitAnswer({ text, type: "WRITE" })
      }}
      onDraftSave={(text) => writeLessonDraftText(learnerId, step.id, text)}
      placeholder={step.placeholder}
      reference={step.reference}
      sample={step.sample}
      structure={step.structure}
      text={text}
      title={step.title ?? step.prompt ?? ""}
    />
  )
}

type AiFeedbackLessonStep = Extract<
  LessonStep,
  { readonly type: "AI_FEEDBACK" }
>

function LessonAiFeedbackAnswer({
  learnerId,
  onAiFeedbackRequest,
  step,
}: {
  readonly learnerId: string
  readonly onAiFeedbackRequest: LessonStepRendererProps["onAiFeedbackRequest"]
  readonly step: AiFeedbackLessonStep
}) {
  const draftText = useLessonDraftText(learnerId, step.target)

  return (
    <AiFeedbackAnswer
      allowRetry
      draftText={draftText}
      focus={step.focus}
      onRequest={async () =>
        onAiFeedbackRequest === undefined
          ? { message: "AI 코칭을 사용할 수 없습니다.", status: "error" }
          : onAiFeedbackRequest({ stepId: step.id })
      }
    />
  )
}

function useLessonDraftText(learnerId: string, stepId: string): string {
  const subscribe = useCallback(
    (listener: () => void) =>
      subscribeToLessonDraftText(learnerId, stepId, listener),
    [learnerId, stepId]
  )
  const getSnapshot = useCallback(
    () => readLessonDraftText(learnerId, stepId),
    [learnerId, stepId]
  )

  return useSyncExternalStore(subscribe, getSnapshot, readEmptyLessonDraftText)
}

function readEmptyLessonDraftText(): string {
  return ""
}

function toCheckedVisual(
  step: LessonStep,
  checked: LessonStepCheckedState | false
): LessonStepCheckedVisual {
  if (checked === false) return false
  if (checked.type === "SELECT" && step.type === "SELECT") {
    const indexById = new Map(step.items.map((item, index) => [item.id, index]))
    return {
      explanation: checked.explanation,
      missed: checked.items.flatMap((item) =>
        item.verdict === "missed" ? [indexById.get(item.id) ?? -1] : []
      ),
      wrong: checked.items.flatMap((item) =>
        item.verdict === "incorrect" ? [indexById.get(item.id) ?? -1] : []
      ),
    }
  }
  return "correct" in checked
    ? checked.correct
      ? "correct"
      : "wrong"
    : "correct"
}

function getCorrectItemIds(
  checked: LessonStepCheckedState | false
): readonly LessonStepItemId[] {
  return checked !== false && "correctItemIds" in checked
    ? checked.correctItemIds
    : []
}

function getEvaluationExplanation(
  checked: LessonStepCheckedState | false
): string {
  return checked !== false && "explanation" in checked
    ? checked.explanation
    : ""
}

function mapTextsToItemIds<TId extends string>(
  items: readonly { readonly id: TId; readonly text: string }[],
  texts: readonly string[]
): TId[] {
  const remaining = [...items]
  return texts.map((text) => {
    const index = remaining.findIndex((item) => item.text === text)
    if (index < 0) throw new Error(`선택 항목을 찾을 수 없습니다: ${text}`)
    const [item] = remaining.splice(index, 1)
    if (item === undefined)
      throw new Error(`선택 항목을 찾을 수 없습니다: ${text}`)
    return item.id
  })
}

function findItemIdById<TId extends string>(
  items: readonly { readonly id: TId }[],
  id: string
): TId {
  const item = items.find((candidate) => candidate.id === id)
  if (item === undefined) throw new Error(`선택 항목을 찾을 수 없습니다: ${id}`)
  return item.id
}
