"use client"

import type { ReactNode } from "react"

import { AiFeedbackAnswer } from "@workspace/ui/components/lesson/ai-feedback-answer"
import { CategorizeAnswer } from "@workspace/ui/components/lesson/categorize-answer"
import { CompareStepView } from "@workspace/ui/components/lesson/compare-step-view"
import { FillBlankAnswer } from "@workspace/ui/components/lesson/fill-blank-answer"
import { LessonStepFrame } from "@workspace/ui/components/lesson/lesson-step-frame"
import { MatchAnswer } from "@workspace/ui/components/lesson/match-answer"
import { MultipleChoiceAnswer } from "@workspace/ui/components/lesson/multiple-choice-answer"
import { OrderAnswer } from "@workspace/ui/components/lesson/order-answer"
import { ReadingStepView } from "@workspace/ui/components/lesson/reading-step-view"
import { SelectAnswer } from "@workspace/ui/components/lesson/select-answer"
import { WriteAnswer } from "@workspace/ui/components/lesson/write-answer"
import {
  readLessonDraftText,
  writeLessonDraftText,
} from "@workspace/ui/lib/lesson-draft-storage"

const adminPreviewDraftNamespace = "admin-step-debug"

import {
  createLessonStepAnswer,
  type LessonAiFeedbackOutcome,
  type LessonAiFeedbackRequest,
  type LessonAnswerChange,
  type LessonStepAnswerPayload,
} from "@/features/step-debug/step-logic"
import { type LessonStepCheckedState } from "@/features/step-debug/step-policy"
import type { LessonStep } from "@/features/step-debug/step-types"

export type LessonStepRendererProps = {
  readonly step: LessonStep
  readonly answerError?: null | string
  readonly checked?: LessonStepCheckedState | false
  readonly onAiFeedbackRequest?: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackOutcome>
  readonly onAnswerChange?: (change: LessonAnswerChange) => Promise<void> | void
  readonly onAnswerPayloadChange?: (change: LessonAnswerPayloadChange) => void
}

type LessonAnswerPayloadChange = {
  readonly payload: LessonStepAnswerPayload
  readonly stepId: string
}

export function LessonStepRenderer({
  answerError,
  checked = false,
  onAiFeedbackRequest,
  onAnswerChange,
  onAnswerPayloadChange,
  step,
}: LessonStepRendererProps) {
  return (
    <LessonStepFrame answerError={answerError} stepId={step.id}>
      {renderStepContent(step, {
        checked,
        onAiFeedbackRequest,
        onAnswerChange,
        onAnswerPayloadChange,
      })}
    </LessonStepFrame>
  )
}

type LessonStepContentHandlers = {
  readonly checked: LessonStepCheckedState | false
  readonly onAiFeedbackRequest: LessonStepRendererProps["onAiFeedbackRequest"]
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly onAnswerPayloadChange: LessonStepRendererProps["onAnswerPayloadChange"]
}

function emitAnswer(
  handlers: LessonStepContentHandlers,
  stepId: string,
  payload: LessonStepAnswerPayload
) {
  handlers.onAnswerPayloadChange?.({
    payload,
    stepId,
  })

  void handlers.onAnswerChange?.({
    answer: createLessonStepAnswer(payload),
    stepId,
  })
}

function renderStepContent(
  step: LessonStep,
  handlers: LessonStepContentHandlers
): ReactNode {
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
          analysis={step.analysis}
          title={step.title}
          versions={step.versions}
        />
      )
    case "MULTIPLE_CHOICE":
      return (
        <MultipleChoiceAnswer
          checked={handlers.checked}
          correctOptionId={step.correct}
          onSelect={(selectedOptionId) =>
            emitAnswer(handlers, step.id, {
              selectedOptionId,
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
          blankCount={step.answer.length}
          checked={handlers.checked}
          onChange={(selectedWords) =>
            emitAnswer(handlers, step.id, {
              selectedWords,
              type: "FILL_BLANK",
            })
          }
          template={step.template}
          words={step.words}
        />
      )
    case "SELECT":
      return (
        <SelectAnswer
          checked={handlers.checked}
          correctIndexes={step.correct}
          explanation={step.explanation}
          layout={step.layout}
          onChange={(selectedIndexes) =>
            emitAnswer(handlers, step.id, {
              selectedIndexes,
              type: "SELECT",
            })
          }
          question={step.question}
          segments={step.segments}
        />
      )
    case "ORDER":
      return (
        <OrderAnswer
          checked={handlers.checked}
          correctItems={step.correct}
          explanation={step.explanation}
          items={step.items}
          onChange={(orderedItems) =>
            emitAnswer(handlers, step.id, {
              orderedItems,
              type: "ORDER",
            })
          }
          showNumbers={step.showNumbers}
          title={step.title}
        />
      )
    case "MATCH":
      return (
        <MatchAnswer
          checked={handlers.checked}
          explanation={step.explanation}
          guide={step.guide}
          onChange={(pairs) =>
            emitAnswer(handlers, step.id, {
              pairs,
              type: "MATCH",
            })
          }
          pairs={step.pairs}
          title={step.title}
        />
      )
    case "CATEGORIZE":
      return (
        <CategorizeAnswer
          categories={step.categories}
          checked={handlers.checked}
          explanation={step.explanation}
          guide={step.guide}
          items={step.items}
          onChange={(items) =>
            emitAnswer(handlers, step.id, {
              items,
              type: "CATEGORIZE",
            })
          }
          title={step.title}
        />
      )
    case "WRITE": {
      const title = step.title ?? step.prompt ?? ""
      const guide = step.guide || step.context
      const badge =
        step.badge ??
        (step.mode === "counter"
          ? "반박 쓰기"
          : step.mode === "self-rebut"
            ? "자기 반박"
            : undefined)
      const claimLabel =
        step.claimLabel ??
        (step.mode === "self-rebut" ? "내 주장" : "대상 주장")
      const placeholder =
        step.placeholder ??
        (step.mode === "self-rebut"
          ? "내 주장의 약점을 스스로 짚어보세요..."
          : "여기에 작성하세요...")

      return (
        <WriteAnswer
          badge={badge}
          checked={handlers.checked}
          claim={step.claim}
          claimLabel={claimLabel}
          draft={step.draft}
          goal={step.goal}
          guide={guide}
          initialText={readLessonDraftText(adminPreviewDraftNamespace, step.id)}
          max={step.max}
          min={step.min || 20}
          onChange={(text) => {
            writeLessonDraftText(adminPreviewDraftNamespace, step.id, text)
            emitAnswer(handlers, step.id, {
              text,
              type: "WRITE",
            })
          }}
          onDraftSave={(text) =>
            writeLessonDraftText(adminPreviewDraftNamespace, step.id, text)
          }
          placeholder={placeholder}
          reference={step.reference}
          sample={step.sample}
          structure={step.structure}
          title={title}
        />
      )
    }
    case "AI_FEEDBACK": {
      const draftText = readLessonDraftText(
        adminPreviewDraftNamespace,
        step.target
      )

      return (
        <AiFeedbackAnswer
          allowRetry={step.allowRetry}
          draftText={draftText}
          focus={step.focus}
          onRequest={async () => {
            if (handlers.onAiFeedbackRequest === undefined) {
              return {
                message: "AI 코칭을 사용할 수 없습니다.",
                status: "error",
              }
            }

            return handlers.onAiFeedbackRequest({
              answer: draftText,
              stepId: step.id,
            })
          }}
        />
      )
    }
  }
}
