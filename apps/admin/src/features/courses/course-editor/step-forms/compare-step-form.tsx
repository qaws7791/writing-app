import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function CompareStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <div className="course-editor-form-grid">
        <label className="admin-form-field">
          <span>초안</span>
          <Textarea defaultValue={String(content["before"] ?? "")} />
        </label>
        <label className="admin-form-field">
          <span>수정본</span>
          <Textarea defaultValue={String(content["after"] ?? "")} />
        </label>
      </div>
    </StepFormShell>
  )
}
