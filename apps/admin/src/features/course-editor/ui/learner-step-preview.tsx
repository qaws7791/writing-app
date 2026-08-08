"use client"

import dynamic from "next/dynamic"
import type { ReactNode } from "react"

import type { EditorStep } from "@/features/course-editor/model/editor-step"
import { CategorizeAnswer } from "@workspace/ui/components/lesson/categorize-answer"
import { FillBlankAnswer } from "@workspace/ui/components/lesson/fill-blank-answer"
import { MatchAnswer } from "@workspace/ui/components/lesson/match-answer"
import { MultipleChoiceAnswer } from "@workspace/ui/components/lesson/multiple-choice-answer"
import { ReadingStepView } from "@workspace/ui/components/lesson/reading-step-view"
import { SelectAnswer } from "@workspace/ui/components/lesson/select-answer"
import { WriteAnswer } from "@workspace/ui/components/lesson/write-answer"
import {
  Coaching,
  CoachingFocus,
  CoachingSource,
  CoachingSourceBody,
  CoachingSourceLabel,
} from "@workspace/ui/components/ui/coaching"
import {
  Step,
  StepBody,
  StepHeader,
  StepTitle,
} from "@workspace/ui/components/ui/step"

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

/**
 * 학습자 앱과 같은 `@workspace/ui/components/lesson` 렌더러로 draft를 보여준다.
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
          guide={step.guide}
          {...(step.source === undefined ? {} : { source: step.source })}
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
          correctOptionId={step.correct}
          options={step.options}
          question={step.question}
        />
      )
    case "FILL_BLANK":
      return (
        <FillBlankAnswer
          blankCount={step.answer.length}
          choices={step.wordIds.map((id, index) => ({
            id,
            text: step.words[index] ?? "",
          }))}
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
          items={step.itemIds.map((id, index) => ({
            id,
            text: step.items[index] ?? "",
          }))}
          seed={step.id}
          {...(step.showNumbers === undefined
            ? {}
            : { showNumbers: step.showNumbers })}
          title={step.title}
        />
      )
    case "MATCH":
      return (
        <MatchAnswer
          connections={[]}
          guide={step.guide}
          leftChoices={step.pairs.map((pair) => ({
            id: pair.leftId,
            text: pair.left,
          }))}
          rightChoices={step.pairs.map((pair) => ({
            id: pair.rightId,
            text: pair.right,
          }))}
          title={step.title}
        />
      )
    case "CATEGORIZE":
      return (
        <CategorizeAnswer
          categories={step.categories}
          guide={step.guide}
          items={step.items}
          title={step.title}
        />
      )
    case "WRITE":
      return (
        <WriteAnswer
          {...(step.badge === undefined ? {} : { badge: step.badge })}
          {...(step.claim === undefined ? {} : { claim: step.claim })}
          {...(step.goal === undefined ? {} : { goal: step.goal })}
          {...(step.guide === undefined ? {} : { guide: step.guide })}
          {...(step.max === undefined ? {} : { max: step.max })}
          min={step.min}
          {...(step.placeholder === undefined
            ? {}
            : { placeholder: step.placeholder })}
          {...(step.reference === undefined
            ? {}
            : { reference: step.reference })}
          {...(step.sample === undefined ? {} : { sample: step.sample })}
          {...(step.structure === undefined
            ? {}
            : { structure: step.structure })}
          title={step.title ?? step.prompt ?? "쓰기"}
        />
      )
    case "AI_FEEDBACK":
      return (
        <>
          <StepHeader>
            <StepTitle>
              <h2>AI 코칭</h2>
            </StepTitle>
          </StepHeader>
          <StepBody>
            <Coaching status="idle">
              <CoachingFocus>
                코칭 초점:{" "}
                {step.focus.trim().length === 0 ? "미입력" : step.focus}
              </CoachingFocus>
              <CoachingSource>
                <CoachingSourceLabel>작성 내용</CoachingSourceLabel>
                <CoachingSourceBody>
                  학습자는 앞선 쓰기 답안으로 AI 코칭을 요청합니다.
                </CoachingSourceBody>
              </CoachingSource>
            </Coaching>
          </StepBody>
        </>
      )
  }
}
