import * as React from "react"

import type { AdminEditorStepType } from "@workspace/core/admin"

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

export const STEP_FORM_BY_TYPE = {
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
