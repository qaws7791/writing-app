import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Input } from "@workspace/ui/components/ui/input"

export function MultipleChoiceStepForm({
  step,
}: {
  readonly step: EditorStep
}) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <label className="admin-form-field">
        <span>질문</span>
        <Input defaultValue={String(content["prompt"] ?? "")} />
      </label>
      <label className="admin-form-field">
        <span>정답</span>
        <Input defaultValue={String(content["answer"] ?? "")} />
      </label>
    </StepFormShell>
  )
}
