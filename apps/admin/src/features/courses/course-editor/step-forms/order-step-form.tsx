import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function OrderStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <Textarea
        aria-label="ORDER items"
        defaultValue={JSON.stringify(content["items"] ?? [], null, 2)}
      />
    </StepFormShell>
  )
}
