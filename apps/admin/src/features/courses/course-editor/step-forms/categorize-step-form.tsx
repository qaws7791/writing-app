import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function CategorizeStepForm({ step }: { readonly step: EditorStep }) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <Textarea
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
