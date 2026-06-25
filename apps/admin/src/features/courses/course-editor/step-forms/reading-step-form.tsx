import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function ReadingStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <label className="admin-form-field">
        <span>본문</span>
        <Textarea defaultValue={String(content["body"] ?? "")} />
      </label>
    </StepFormShell>
  )
}
