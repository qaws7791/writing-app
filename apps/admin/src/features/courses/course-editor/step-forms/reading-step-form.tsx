import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-form-contract"

export function ReadingStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <label className="admin-form-field">
        <span>본문</span>
        <textarea defaultValue={String(content["body"] ?? "")} />
      </label>
    </StepFormShell>
  )
}
