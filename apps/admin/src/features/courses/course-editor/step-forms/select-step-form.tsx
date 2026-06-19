import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"

export function SelectStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <p className="step-form-help">segments 입력 보조</p>
      <textarea
        aria-label="SELECT segments"
        defaultValue={JSON.stringify(content["segments"] ?? [], null, 2)}
      />
    </StepFormShell>
  )
}
