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
import type { AdminCourseDetailDto } from "@workspace/core/admin"

export type EditorStep =
  AdminCourseDetailDto["units"][number]["lessons"][number]["steps"][number]

type StepFormComponent = (props: {
  readonly step: EditorStep
}) => React.ReactNode

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

export function readStepContent(step: EditorStep): Record<string, unknown> {
  const parsed = JSON.parse(step.contentJson) as unknown
  if (isStepContentRecord(parsed)) {
    return parsed
  }

  throw new Error(`레슨 스텝 contentJson은 객체여야 합니다. stepId=${step.id}`)
}

function isStepContentRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function StepFormShell({
  children,
  step,
}: {
  readonly children: React.ReactNode
  readonly step: EditorStep
}) {
  return (
    <article className="step-form-card">
      <header>
        <strong>{step.type}</strong>
        <span>{step.id}</span>
      </header>
      {children}
    </article>
  )
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
