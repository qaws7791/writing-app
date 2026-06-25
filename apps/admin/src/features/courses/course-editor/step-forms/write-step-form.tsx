import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Input } from "@workspace/ui/components/ui/input"

export function WriteStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)
  const min = Number(content["min"] ?? 0)
  const goal = Number(content["goal"] ?? 0)
  const max = Number(content["max"] ?? 0)

  return (
    <StepFormShell step={step}>
      <p className="step-form-help">
        min {min} · goal {goal} · max {max}
      </p>
      <div className="course-editor-form-grid">
        <label className="admin-form-field">
          <span>최소</span>
          <Input defaultValue={min} type="number" />
        </label>
        <label className="admin-form-field">
          <span>목표</span>
          <Input defaultValue={goal} type="number" />
        </label>
        <label className="admin-form-field">
          <span>최대</span>
          <Input defaultValue={max} type="number" />
        </label>
      </div>
    </StepFormShell>
  )
}
