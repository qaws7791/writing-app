"use client"

import * as React from "react"
import { ArrowLeft } from "lucide-react"

import type {
  AdminEditorLessonDetailDto,
  AdminEditorStepType,
} from "@workspace/core/admin"
import { Button } from "@workspace/ui/components/ui/button"

import {
  formatPointLabel,
  getNodeStatusLabel,
  getStepDisplayTitle,
} from "@/features/courses/course-editor/editor-labels"
import { AiFeedbackStepForm } from "@/features/courses/course-editor/step-forms/ai-feedback-step-form"
import { ChecklistStepForm } from "@/features/courses/course-editor/step-forms/checklist-step-form"
import { ClassifyStepForm } from "@/features/courses/course-editor/step-forms/classify-step-form"
import { CompareStepForm } from "@/features/courses/course-editor/step-forms/compare-step-form"
import { CompleteStepForm } from "@/features/courses/course-editor/step-forms/complete-step-form"
import { ConceptStepForm } from "@/features/courses/course-editor/step-forms/concept-step-form"
import { ExampleRevealStepForm } from "@/features/courses/course-editor/step-forms/example-reveal-step-form"
import { FillBlankStepForm } from "@/features/courses/course-editor/step-forms/fill-blank-step-form"
import { IntroStepForm } from "@/features/courses/course-editor/step-forms/intro-step-form"
import { LongWriteStepForm } from "@/features/courses/course-editor/step-forms/long-write-step-form"
import { MatchStepForm } from "@/features/courses/course-editor/step-forms/match-step-form"
import { MultipleChoiceStepForm } from "@/features/courses/course-editor/step-forms/multiple-choice-step-form"
import { ReadingPassageStepForm } from "@/features/courses/course-editor/step-forms/reading-passage-step-form"
import { ReflectionStepForm } from "@/features/courses/course-editor/step-forms/reflection-step-form"
import { ReorderStepForm } from "@/features/courses/course-editor/step-forms/reorder-step-form"
import { RevisionStepForm } from "@/features/courses/course-editor/step-forms/revision-step-form"
import { ShortWriteStepForm } from "@/features/courses/course-editor/step-forms/short-write-step-form"
import { SummaryStepForm } from "@/features/courses/course-editor/step-forms/summary-step-form"
import type { StepFormProps } from "@/features/courses/course-editor/step-forms/step-form-fields"
import { TranscribeStepForm } from "@/features/courses/course-editor/step-forms/transcribe-step-form"
import { WordSelectStepForm } from "@/features/courses/course-editor/step-forms/word-select-step-form"

type StepWorkspaceProps = {
  isReadOnly?: boolean
  lessonSteps: AdminEditorLessonDetailDto["steps"]
  onBack?: () => void
  onUpdateStepContent?: (stepId: string, key: string, value: unknown) => void
  step: AdminEditorLessonDetailDto["steps"][number]
}

const stepFormByType = {
  INTRO: IntroStepForm,
  CONCEPT: ConceptStepForm,
  READING_PASSAGE: ReadingPassageStepForm,
  EXAMPLE_REVEAL: ExampleRevealStepForm,
  COMPARE: CompareStepForm,
  MULTIPLE_CHOICE: MultipleChoiceStepForm,
  FILL_BLANK: FillBlankStepForm,
  WORD_SELECT: WordSelectStepForm,
  REORDER: ReorderStepForm,
  MATCH: MatchStepForm,
  CLASSIFY: ClassifyStepForm,
  SHORT_WRITE: ShortWriteStepForm,
  LONG_WRITE: LongWriteStepForm,
  AI_FEEDBACK: AiFeedbackStepForm,
  REVISION: RevisionStepForm,
  CHECKLIST: ChecklistStepForm,
  REFLECTION: ReflectionStepForm,
  SUMMARY: SummaryStepForm,
  TRANSCRIBE: TranscribeStepForm,
  COMPLETE: CompleteStepForm,
} satisfies Record<AdminEditorStepType, React.ComponentType<StepFormProps>>

export function StepWorkspace({
  isReadOnly = false,
  lessonSteps,
  onBack,
  onUpdateStepContent,
  step,
}: StepWorkspaceProps) {
  const StepForm = stepFormByType[step.type]
  const stepTitle = getStepDisplayTitle(step)

  return (
    <div className="space-y-6">
      <header className="space-y-3 border-b pb-4">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground"
            onClick={onBack}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            레슨으로 돌아가기
          </Button>
        )}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {getNodeStatusLabel(step.status)} · {formatPointLabel(step.points)}{" "}
            · {step.required ? "필수 스텝" : "선택 스텝"}
          </p>
          <h1 className="text-2xl font-semibold">{stepTitle}</h1>
        </div>
      </header>
      <StepForm
        isReadOnly={isReadOnly}
        lessonSteps={lessonSteps}
        onUpdateContent={(key, value) =>
          onUpdateStepContent?.(step.id, key, value)
        }
        step={step}
      />
    </div>
  )
}
