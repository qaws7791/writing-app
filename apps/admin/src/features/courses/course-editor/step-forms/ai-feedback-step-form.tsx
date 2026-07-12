import {
  StepFormShell,
  type StepFormProps,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"

export function AiFeedbackStepForm({ step }: StepFormProps<"AI_FEEDBACK">) {
  return (
    <StepFormShell step={step}>
      <FieldDescription>
        target step: {step.target} · score {step.score}/{step.scoreMax}
      </FieldDescription>
      <Field>
        <FieldLabel htmlFor={`${step.id}-target-step`}>target step</FieldLabel>
        <Input id={`${step.id}-target-step`} defaultValue={step.target} />
      </Field>
    </StepFormShell>
  )
}
