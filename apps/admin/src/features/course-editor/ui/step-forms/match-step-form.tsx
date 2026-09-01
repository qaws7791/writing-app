import {
  parseEditorStepChange,
  StepFormShell,
  StepJsonField,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

export function MatchStepForm({ onChange, step }: StepFormProps<"MATCH">) {
  return (
    <StepFormShell step={step}>
      <StepTextField
        id={`${step.id}-title`}
        label="제목"
        onChange={(title) => onChange({ ...step, title })}
        value={step.title}
      />
      <StepJsonField
        id={`${step.id}-pairs`}
        label="연결할 항목"
        onCommit={(pairs) => {
          const changed = parseEditorStepChange(step, { pairs })
          if (changed?.type !== "MATCH") return false
          onChange(changed)
          return true
        }}
        value={step.pairs}
      />
      <StepTextField
        id={`${step.id}-explanation`}
        label="해설"
        multiline
        onChange={(explanation) => onChange({ ...step, explanation })}
        value={step.explanation}
      />
    </StepFormShell>
  )
}
