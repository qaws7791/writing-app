import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Input } from "@workspace/ui/components/ui/input"

export function AiFeedbackStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)
  const sourceStepId = String(content["sourceStepId"] ?? "")
  const retryLimit = Number(content["retryLimit"] ?? 3)

  return (
    <StepFormShell step={step}>
      <p className="step-form-help">
        source step: {sourceStepId} · retry {retryLimit}회
      </p>
      <label className="admin-form-field">
        <span>source step</span>
        <Input defaultValue={sourceStepId} />
      </label>
    </StepFormShell>
  )
}
