import {
  StepFormShell,
  type StepFormProps,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function CompareStepForm({ step }: StepFormProps<"COMPARE">) {
  return (
    <StepFormShell step={step}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${step.id}-before`}>초안</FieldLabel>
          <Textarea
            id={`${step.id}-before`}
            defaultValue={step.versions[0]?.text}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${step.id}-after`}>수정본</FieldLabel>
          <Textarea
            id={`${step.id}-after`}
            defaultValue={step.versions[1]?.text}
          />
        </Field>
      </div>
    </StepFormShell>
  )
}
