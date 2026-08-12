import type { LessonStepType } from "@workspace/contracts/content/steps"

import type { EditorStep } from "@/features/course-editor/model/editor-step"
import { CategorizeStepForm } from "@/features/course-editor/ui/step-forms/categorize-step-form"
import { CompareStepForm } from "@/features/course-editor/ui/step-forms/compare-step-form"
import { FillBlankStepForm } from "@/features/course-editor/ui/step-forms/fill-blank-step-form"
import { MatchStepForm } from "@/features/course-editor/ui/step-forms/match-step-form"
import { MultipleChoiceStepForm } from "@/features/course-editor/ui/step-forms/multiple-choice-step-form"
import { OrderStepForm } from "@/features/course-editor/ui/step-forms/order-step-form"
import { ReadingStepForm } from "@/features/course-editor/ui/step-forms/reading-step-form"
import { SelectStepForm } from "@/features/course-editor/ui/step-forms/select-step-form"
import type { StepFormProps } from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

type StepFormRegistry = {
  readonly [TType in LessonStepType]: (
    _props: StepFormProps<TType>
  ) => React.ReactNode
}

const stepFormByType = {
  CATEGORIZE: CategorizeStepForm,
  COMPARE: CompareStepForm,
  FILL_BLANK: FillBlankStepForm,
  MATCH: MatchStepForm,
  MULTIPLE_CHOICE: MultipleChoiceStepForm,
  ORDER: OrderStepForm,
  READING: ReadingStepForm,
  SELECT: SelectStepForm,
} satisfies StepFormRegistry

export function renderStepForm(
  step: EditorStep,
  onChange: (step: EditorStep) => void,
  assetUpload: StepFormProps<EditorStep["type"]>["assetUpload"]
): React.ReactNode {
  switch (step.type) {
    case "CATEGORIZE": {
      const StepForm = stepFormByType.CATEGORIZE
      return (
        <StepForm assetUpload={assetUpload} onChange={onChange} step={step} />
      )
    }
    case "COMPARE": {
      const StepForm = stepFormByType.COMPARE
      return (
        <StepForm assetUpload={assetUpload} onChange={onChange} step={step} />
      )
    }
    case "FILL_BLANK": {
      const StepForm = stepFormByType.FILL_BLANK
      return (
        <StepForm assetUpload={assetUpload} onChange={onChange} step={step} />
      )
    }
    case "MATCH": {
      const StepForm = stepFormByType.MATCH
      return (
        <StepForm assetUpload={assetUpload} onChange={onChange} step={step} />
      )
    }
    case "MULTIPLE_CHOICE": {
      const StepForm = stepFormByType.MULTIPLE_CHOICE
      return (
        <StepForm assetUpload={assetUpload} onChange={onChange} step={step} />
      )
    }
    case "ORDER": {
      const StepForm = stepFormByType.ORDER
      return (
        <StepForm assetUpload={assetUpload} onChange={onChange} step={step} />
      )
    }
    case "READING": {
      const StepForm = stepFormByType.READING
      return (
        <StepForm assetUpload={assetUpload} onChange={onChange} step={step} />
      )
    }
    case "SELECT": {
      const StepForm = stepFormByType.SELECT
      return (
        <StepForm assetUpload={assetUpload} onChange={onChange} step={step} />
      )
    }
  }
}
