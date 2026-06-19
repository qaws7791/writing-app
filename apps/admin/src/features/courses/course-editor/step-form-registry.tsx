import { AiFeedbackStepForm } from "@/features/courses/course-editor/step-forms/ai-feedback-step-form"
import { CategorizeStepForm } from "@/features/courses/course-editor/step-forms/categorize-step-form"
import { CompareStepForm } from "@/features/courses/course-editor/step-forms/compare-step-form"
import { FillBlankStepForm } from "@/features/courses/course-editor/step-forms/fill-blank-step-form"
import { MatchStepForm } from "@/features/courses/course-editor/step-forms/match-step-form"
import { MultipleChoiceStepForm } from "@/features/courses/course-editor/step-forms/multiple-choice-step-form"
import { OrderStepForm } from "@/features/courses/course-editor/step-forms/order-step-form"
import { ReadingStepForm } from "@/features/courses/course-editor/step-forms/reading-step-form"
import { SelectStepForm } from "@/features/courses/course-editor/step-forms/select-step-form"
import { WriteStepForm } from "@/features/courses/course-editor/step-forms/write-step-form"
import {
  StepFormShell,
  type EditorStep,
  type StepFormComponent,
} from "@/features/courses/course-editor/step-form-contract"

const stepFormByType: Partial<Record<EditorStep["type"], StepFormComponent>> = {
  AI_FEEDBACK: AiFeedbackStepForm,
  CATEGORIZE: CategorizeStepForm,
  COMPARE: CompareStepForm,
  FILL_BLANK: FillBlankStepForm,
  MATCH: MatchStepForm,
  MULTIPLE_CHOICE: MultipleChoiceStepForm,
  ORDER: OrderStepForm,
  READING: ReadingStepForm,
  SELECT: SelectStepForm,
  WRITE: WriteStepForm,
}

export function renderStepForm(step: EditorStep) {
  const StepForm = stepFormByType[step.type] ?? GenericStepForm

  return <StepForm step={step} />
}

function GenericStepForm({ step }: { readonly step: EditorStep }) {
  return (
    <StepFormShell step={step}>
      <label className="admin-form-field">
        <span>content JSON</span>
        <textarea defaultValue={step.contentJson} />
      </label>
    </StepFormShell>
  )
}
