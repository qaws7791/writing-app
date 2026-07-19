import {
  StepFormShell,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function MatchStepForm({ step }: StepFormProps<"MATCH">) {
  return (
    <StepFormShell step={step}>
      <Textarea
        aria-label="MATCH pairs"
        defaultValue={JSON.stringify(step.pairs, null, 2)}
      />
    </StepFormShell>
  )
}
