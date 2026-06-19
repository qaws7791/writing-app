import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-form-contract"

export function CompareStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <div className="course-editor-form-grid">
        <label className="admin-form-field">
          <span>초안</span>
          <textarea defaultValue={String(content["before"] ?? "")} />
        </label>
        <label className="admin-form-field">
          <span>수정본</span>
          <textarea defaultValue={String(content["after"] ?? "")} />
        </label>
      </div>
    </StepFormShell>
  )
}
