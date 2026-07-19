import {
  StepFormShell,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"
import { FieldDescription } from "@workspace/ui/components/ui/field"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function SelectStepForm({ step }: StepFormProps<"SELECT">) {
  return (
    <StepFormShell step={step}>
      <FieldDescription>segments 입력 보조</FieldDescription>
      <Textarea
        aria-label="SELECT segments"
        defaultValue={JSON.stringify(step.segments, null, 2)}
      />
    </StepFormShell>
  )
}
