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
} from "@/features/course-editor/ui/step-forms"

type StepFormRegistry = {
  readonly [TType in EditorStep["type"]]: (
    _props: StepFormProps<TType>
  ) => React.ReactNode
}

const stepFormByType = {
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

export function renderStepForm(
  step: EditorStep,
  onChange: (step: EditorStep) => void
): React.ReactNode {
  switch (step.type) {
    case "AI_FEEDBACK": {
      const StepForm = stepFormByType.AI_FEEDBACK
      return <StepForm onChange={onChange} step={step} />
    }
    case "CATEGORIZE": {
      const StepForm = stepFormByType.CATEGORIZE
      return <StepForm onChange={onChange} step={step} />
    }
    case "COMPARE": {
      const StepForm = stepFormByType.COMPARE
      return <StepForm onChange={onChange} step={step} />
    }
    case "FILL_BLANK": {
      const StepForm = stepFormByType.FILL_BLANK
      return <StepForm onChange={onChange} step={step} />
    }
    case "MATCH": {
      const StepForm = stepFormByType.MATCH
      return <StepForm onChange={onChange} step={step} />
    }
    case "MULTIPLE_CHOICE": {
      const StepForm = stepFormByType.MULTIPLE_CHOICE
      return <StepForm onChange={onChange} step={step} />
    }
    case "ORDER": {
      const StepForm = stepFormByType.ORDER
      return <StepForm onChange={onChange} step={step} />
    }
    case "READING": {
      const StepForm = stepFormByType.READING
      return <StepForm onChange={onChange} step={step} />
    }
    case "SELECT": {
      const StepForm = stepFormByType.SELECT
      return <StepForm onChange={onChange} step={step} />
    }
    case "WRITE": {
      const StepForm = stepFormByType.WRITE
      return <StepForm onChange={onChange} step={step} />
    }
  }
}
