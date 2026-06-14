import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-form-registry"

export function MatchStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <textarea
        aria-label="MATCH pairs"
        defaultValue={JSON.stringify(content["pairs"] ?? [], null, 2)}
      />
    </StepFormShell>
  )
}
