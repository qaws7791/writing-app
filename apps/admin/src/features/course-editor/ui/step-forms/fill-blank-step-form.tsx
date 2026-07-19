import {
  StepFormShell,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"

export function FillBlankStepForm({ step }: StepFormProps<"FILL_BLANK">) {
  return (
    <StepFormShell step={step}>
      <Field>
        <FieldLabel htmlFor={`${step.id}-prompt`}>빈칸 문장</FieldLabel>
        <Input id={`${step.id}-prompt`} defaultValue={step.template} />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${step.id}-answer`}>정답</FieldLabel>
        <Input id={`${step.id}-answer`} defaultValue={step.answer.join(", ")} />
      </Field>
    </StepFormShell>
  )
}
