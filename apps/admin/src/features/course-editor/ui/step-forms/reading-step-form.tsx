import {
  StepFormShell,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function ReadingStepForm({ step }: StepFormProps<"READING">) {
  return (
    <StepFormShell step={step}>
      <Field>
        <FieldLabel htmlFor={`${step.id}-body`}>본문</FieldLabel>
        <Textarea id={`${step.id}-body`} defaultValue={step.body} />
      </Field>
    </StepFormShell>
  )
}
