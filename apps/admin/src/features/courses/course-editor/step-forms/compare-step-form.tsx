import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function CompareStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${step.id}-before`}>초안</FieldLabel>
          <Textarea
            id={`${step.id}-before`}
            defaultValue={String(content["before"] ?? "")}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${step.id}-after`}>수정본</FieldLabel>
          <Textarea
            id={`${step.id}-after`}
            defaultValue={String(content["after"] ?? "")}
          />
        </Field>
      </div>
    </StepFormShell>
  )
}
