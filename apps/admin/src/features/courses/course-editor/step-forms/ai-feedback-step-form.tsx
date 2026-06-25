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

export function AiFeedbackStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)
  const sourceStepId = String(content["sourceStepId"] ?? "")
  const retryLimit = Number(content["retryLimit"] ?? 3)

  return (
    <StepFormShell step={step}>
      <FieldDescription>
        source step: {sourceStepId} · retry {retryLimit}회
      </FieldDescription>
      <Field>
        <FieldLabel htmlFor={`${step.id}-source-step`}>source step</FieldLabel>
        <Input id={`${step.id}-source-step`} defaultValue={sourceStepId} />
      </Field>
    </StepFormShell>
  )
}
