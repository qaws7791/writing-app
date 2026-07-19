import {
  StepFormShell,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function OrderStepForm({ step }: StepFormProps<"ORDER">) {
  return (
    <StepFormShell step={step}>
      <Textarea
        aria-label="ORDER items"
        defaultValue={JSON.stringify(step.items, null, 2)}
      />
    </StepFormShell>
  )
}
