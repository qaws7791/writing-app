import {
  StepFormShell,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

export function ReadingStepForm({ onChange, step }: StepFormProps<"READING">) {
  return (
    <StepFormShell step={step}>
      <StepTextField
        id={`${step.id}-title`}
        label="제목"
        onChange={(title) => onChange({ ...step, title })}
        value={step.title}
      />
      <StepTextField
        id={`${step.id}-guide`}
        label="안내"
        multiline
        onChange={(guide) => onChange({ ...step, guide })}
        value={step.guide}
      />
      <StepTextField
        id={`${step.id}-body`}
        label="본문"
        multiline
        onChange={(body) => onChange({ ...step, body })}
        value={step.body}
      />
      <StepTextField
        id={`${step.id}-source`}
        label="출처"
        onChange={(source) =>
          onChange({ ...step, source: source === "" ? undefined : source })
        }
        value={step.source}
      />
    </StepFormShell>
  )
}
