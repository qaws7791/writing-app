import {
  parseEditorStepChange,
  StepFormShell,
  StepJsonField,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

export function CompareStepForm({ onChange, step }: StepFormProps<"COMPARE">) {
  return (
    <StepFormShell step={step}>
      <StepTextField
        id={`${step.id}-title`}
        label="제목"
        onChange={(title) => onChange({ ...step, title })}
        value={step.title}
      />
      <StepTextField
        id={`${step.id}-analysis`}
        label="분석"
        onChange={(analysis) => onChange({ ...step, analysis })}
        value={step.analysis}
      />
      <StepJsonField
        id={`${step.id}-versions`}
        label="비교할 글 버전"
        onCommit={(versions) => {
          const changed = parseEditorStepChange(step, { versions })
          if (changed?.type !== "COMPARE") return false
          onChange(changed)
          return true
        }}
        value={step.versions}
      />
    </StepFormShell>
  )
}
