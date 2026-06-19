import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-form-contract"

export function CategorizeStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <textarea
        aria-label="CATEGORIZE categories"
        defaultValue={JSON.stringify(
          {
            categories: content["categories"] ?? [],
            items: content["items"] ?? [],
          },
          null,
          2
        )}
      />
    </StepFormShell>
  )
}
