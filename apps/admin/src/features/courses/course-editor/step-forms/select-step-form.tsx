import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { FieldDescription } from "@workspace/ui/components/ui/field"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function SelectStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <FieldDescription>segments 입력 보조</FieldDescription>
      <Textarea
        aria-label="SELECT segments"
        defaultValue={JSON.stringify(content["segments"] ?? [], null, 2)}
      />
    </StepFormShell>
  )
}
