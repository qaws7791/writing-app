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

export function WriteStepForm({ step }: StepFormProps<"WRITE">) {
  return (
    <StepFormShell step={step}>
      <FieldDescription>
        min {step.min} · goal {step.goal ?? "-"} · max {step.max ?? "-"}
      </FieldDescription>
      <div className="grid gap-4 md:grid-cols-3">
        <Field>
          <FieldLabel htmlFor={`${step.id}-min`}>최소</FieldLabel>
          <Input id={`${step.id}-min`} defaultValue={step.min} type="number" />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${step.id}-goal`}>목표</FieldLabel>
          <Input
            id={`${step.id}-goal`}
            defaultValue={step.goal}
            type="number"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${step.id}-max`}>최대</FieldLabel>
          <Input id={`${step.id}-max`} defaultValue={step.max} type="number" />
        </Field>
      </div>
    </StepFormShell>
  )
}
