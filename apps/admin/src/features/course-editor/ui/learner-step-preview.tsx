"use client"

import dynamic from "next/dynamic"
import type { ReactNode } from "react"

import type { EditorStep } from "@/features/course-editor/model/editor-step"
import { orderAdminPreviewItems } from "@/features/course-editor/model/learner-step-preview-presentation"
import { CategorizeAnswer } from "@workspace/ui/components/learning/categorize-answer"
import { FillBlankAnswer } from "@workspace/ui/components/learning/fill-blank-answer"
import { MatchAnswer } from "@workspace/ui/components/learning/match-answer"
import { MultipleChoiceAnswer } from "@workspace/ui/components/learning/multiple-choice-answer"
import { ReadingStepView } from "@workspace/ui/components/learning/reading-step-view"
import { SelectAnswer } from "@workspace/ui/components/learning/select-answer"
import { Step } from "@workspace/ui/components/learning/step"

const OrderAnswer = dynamic(() =>
  import("@workspace/ui/components/learning/order-answer").then(
    (module) => module.OrderAnswer
  )
)

const CompareStepView = dynamic(() =>
  import("@workspace/ui/components/learning/compare-step-view").then(
    (module) => module.CompareStepView
  )
)

/**
 * 학습자 앱과 같은 `@workspace/ui/components/learning` 렌더러로 draft를 보여준다.
 * 답안·채점·AI 호출은 발행 전 검토 대상이 아니므로 handler를 넘기지 않는다.
 */
export function LearnerStepPreview({
  step,
}: {
  readonly step: EditorStep
}): ReactNode {
  return <Step data-step-id={step.id}>{renderStepPreview(step)}</Step>
}

function renderStepPreview(step: EditorStep): ReactNode {
  switch (step.type) {
    case "READING":
      return (
        <ReadingStepView
          body={step.body}
          {...(step.source === undefined ? {} : { source: step.source })}
          title={step.title}
        />
      )
    case "COMPARE":
      return <CompareStepView title={step.title} versions={step.versions} />
    case "MULTIPLE_CHOICE":
      return (
        <MultipleChoiceAnswer
          correctOptionId={step.correct}
          options={orderAdminPreviewItems(step.options, step.id)}
          question={step.question}
        />
      )
    case "FILL_BLANK":
      return (
        <FillBlankAnswer
          blankCount={step.answer.length}
          choices={orderAdminPreviewItems(
            step.wordIds.map((id, index) => ({
              id,
              text: step.words[index] ?? "",
            })),
            step.id,
            step.answer
          )}
          template={step.template}
        />
      )
    case "SELECT":
      return (
        <SelectAnswer
          correctIndexes={step.correct.flatMap((id) => {
            const index = step.segmentIds.indexOf(id)
            return index < 0 ? [] : [index]
          })}
          {...(step.layout === undefined ? {} : { layout: step.layout })}
          question={step.question}
          segments={step.segments}
        />
      )
    case "ORDER":
      return (
        <OrderAnswer
          correctItemIds={step.correct}
          items={orderAdminPreviewItems(
            step.itemIds.map((id, index) => ({
              id,
              text: step.items[index] ?? "",
            })),
            step.id,
            step.correct
          )}
          seed={step.id}
          title={step.title}
        />
      )
    case "MATCH":
      return (
        <MatchAnswer
          connections={[]}
          leftChoices={orderAdminPreviewItems(
            step.pairs.map((pair) => ({
              id: pair.leftId,
              text: pair.left,
            })),
            step.id
          )}
          rightChoices={orderAdminPreviewItems(
            step.pairs.map((pair) => ({
              id: pair.rightId,
              text: pair.right,
            })),
            step.id
          )}
          title={step.title}
        />
      )
    case "CATEGORIZE":
      return (
        <CategorizeAnswer
          categories={orderAdminPreviewItems(step.categories, step.id)}
          items={orderAdminPreviewItems(step.items, step.id)}
          title={step.title}
        />
      )
  }
}
