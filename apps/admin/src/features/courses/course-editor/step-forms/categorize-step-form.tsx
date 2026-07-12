import {
  StepFormShell,
  type StepFormProps,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function CategorizeStepForm({ step }: StepFormProps<"CATEGORIZE">) {
  return (
    <StepFormShell step={step}>
      <Textarea
        aria-label="CATEGORIZE categories"
        defaultValue={JSON.stringify(
          {
            categories: step.categories,
            items: step.items,
          },
          null,
          2
        )}
      />
    </StepFormShell>
  )
}
