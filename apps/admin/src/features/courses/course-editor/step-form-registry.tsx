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

export function renderStepForm(step: EditorStep) {
  switch (step.type) {
    case "READING":
      return <ReadingStepForm step={step} />
    case "COMPARE":
      return <CompareStepForm step={step} />
    case "MULTIPLE_CHOICE":
      return <MultipleChoiceStepForm step={step} />
    case "FILL_BLANK":
      return <FillBlankStepForm step={step} />
    case "SELECT":
      return <SelectStepForm step={step} />
    case "ORDER":
      return <OrderStepForm step={step} />
    case "WRITE":
      return <WriteStepForm step={step} />
    case "AI_FEEDBACK":
      return <AiFeedbackStepForm step={step} />
    case "MATCH":
      return <MatchStepForm step={step} />
    case "CATEGORIZE":
      return <CategorizeStepForm step={step} />
    default:
      return <GenericStepForm step={step} />
  }
}

export function readStepContent(step: EditorStep): Record<string, unknown> {
  const parsed = JSON.parse(step.contentJson) as unknown

  return typeof parsed === "object" && parsed !== null
    ? (parsed as Record<string, unknown>)
    : {}
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
