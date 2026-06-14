import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-form-registry"

export function OrderStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <textarea
        aria-label="ORDER items"
        defaultValue={JSON.stringify(content["items"] ?? [], null, 2)}
      />
    </StepFormShell>
  )
}
