import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function ReadingStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <Field>
        <FieldLabel htmlFor={`${step.id}-body`}>본문</FieldLabel>
        <Textarea
          id={`${step.id}-body`}
          defaultValue={String(content["body"] ?? "")}
        />
      </Field>
    </StepFormShell>
  )
}
