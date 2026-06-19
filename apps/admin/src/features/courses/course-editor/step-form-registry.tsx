import {
  AiFeedbackStepForm,
  CategorizeStepForm,
  CompareStepForm,
  FillBlankStepForm,
  GenericStepForm,
  MatchStepForm,
  MultipleChoiceStepForm,
  OrderStepForm,
  ReadingStepForm,
  SelectStepForm,
  WriteStepForm,
  type EditorStep,
  type StepFormComponent,
} from "@/features/courses/course-editor/step-forms"

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
