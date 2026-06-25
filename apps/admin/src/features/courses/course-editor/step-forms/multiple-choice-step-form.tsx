import {
  readStepContent,
  StepFormShell,
  type EditorStep,
} from "@/features/courses/course-editor/step-forms/shared/step-form-contract"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"

export function MultipleChoiceStepForm({
  step,
}: {
  readonly step: EditorStep
}) {
  const content = readStepContent(step)

  return (
    <StepFormShell step={step}>
      <Field>
        <FieldLabel htmlFor={`${step.id}-prompt`}>질문</FieldLabel>
        <Input
          id={`${step.id}-prompt`}
          defaultValue={String(content["prompt"] ?? "")}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${step.id}-answer`}>정답</FieldLabel>
        <Input
          id={`${step.id}-answer`}
          defaultValue={String(content["answer"] ?? "")}
        />
      </Field>
    </StepFormShell>
  )
}
