import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"

export function WriteStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)
  const min = Number(content["min"] ?? 0)
  const goal = Number(content["goal"] ?? 0)
  const max = Number(content["max"] ?? 0)

  return (
    <StepFormShell step={step}>
      <FieldDescription>
        min {min} · goal {goal} · max {max}
      </FieldDescription>
      <div className="grid gap-4 md:grid-cols-3">
        <Field>
          <FieldLabel htmlFor={`${step.id}-min`}>최소</FieldLabel>
          <Input id={`${step.id}-min`} defaultValue={min} type="number" />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${step.id}-goal`}>목표</FieldLabel>
          <Input id={`${step.id}-goal`} defaultValue={goal} type="number" />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${step.id}-max`}>최대</FieldLabel>
          <Input id={`${step.id}-max`} defaultValue={max} type="number" />
        </Field>
      </div>
    </StepFormShell>
  )
}
