import {
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"

export function GenericStepForm({ step }: { readonly step: EditorStep }) {
  return (
    <StepFormShell step={step}>
      <label className="admin-form-field">
        <span>content JSON</span>
        <textarea defaultValue={step.contentJson} />
      </label>
    </StepFormShell>
  )
}
