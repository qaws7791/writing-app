import {
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function GenericStepForm({ step }: { readonly step: EditorStep }) {
  return (
    <StepFormShell step={step}>
      <label className="admin-form-field">
        <span>content JSON</span>
        <Textarea defaultValue={step.contentJson} />
      </label>
    </StepFormShell>
  )
}
