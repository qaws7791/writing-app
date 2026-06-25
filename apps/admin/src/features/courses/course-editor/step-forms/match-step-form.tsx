import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function MatchStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <Textarea
        aria-label="MATCH pairs"
        defaultValue={JSON.stringify(content["pairs"] ?? [], null, 2)}
      />
    </StepFormShell>
  )
}
