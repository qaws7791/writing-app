import {
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function GenericStepForm({ step }: { readonly step: EditorStep }) {
  return (
    <StepFormShell step={step}>
      <Field>
        <FieldLabel htmlFor={`${step.id}-content-json`}>
          content JSON
        </FieldLabel>
        <Textarea
          id={`${step.id}-content-json`}
          defaultValue={step.contentJson}
        />
      </Field>
    </StepFormShell>
  )
}
