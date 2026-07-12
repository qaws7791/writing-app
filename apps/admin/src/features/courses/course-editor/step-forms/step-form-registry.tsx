import {
  AiFeedbackStepForm,
  CategorizeStepForm,
  CompareStepForm,
  FillBlankStepForm,
  MatchStepForm,
  MultipleChoiceStepForm,
  OrderStepForm,
  ReadingStepForm,
  SelectStepForm,
  WriteStepForm,
  type EditorStep,
  type StepFormProps,
} from "@/features/courses/course-editor/step-forms"

type StepFormRegistry = {
  readonly [TType in EditorStep["type"]]: (
    _props: StepFormProps<TType>
  ) => React.ReactNode
}

export const stepFormByType = {
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
} satisfies StepFormRegistry

export function renderStepForm(step: EditorStep): React.ReactNode {
  switch (step.type) {
    case "AI_FEEDBACK": {
      const StepForm = stepFormByType.AI_FEEDBACK
      return <StepForm step={step} />
    }
    case "CATEGORIZE": {
      const StepForm = stepFormByType.CATEGORIZE
      return <StepForm step={step} />
    }
    case "COMPARE": {
      const StepForm = stepFormByType.COMPARE
      return <StepForm step={step} />
    }
    case "FILL_BLANK": {
      const StepForm = stepFormByType.FILL_BLANK
      return <StepForm step={step} />
    }
    case "MATCH": {
      const StepForm = stepFormByType.MATCH
      return <StepForm step={step} />
    }
    case "MULTIPLE_CHOICE": {
      const StepForm = stepFormByType.MULTIPLE_CHOICE
      return <StepForm step={step} />
    }
    case "ORDER": {
      const StepForm = stepFormByType.ORDER
      return <StepForm step={step} />
    }
    case "READING": {
      const StepForm = stepFormByType.READING
      return <StepForm step={step} />
    }
    case "SELECT": {
      const StepForm = stepFormByType.SELECT
      return <StepForm step={step} />
    }
    case "WRITE": {
      const StepForm = stepFormByType.WRITE
      return <StepForm step={step} />
    }
  }
}
