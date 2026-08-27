import {
  parseEditorStepChange,
  StepFormShell,
  StepJsonField,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

export function TrueFalseStepForm({
  onChange,
  step,
}: StepFormProps<"TRUE_FALSE">) {
  return (
    <StepFormShell step={step}>
      <StepTextField
        id={`${step.id}-question`}
        label="질문"
        multiline
        onChange={(question) => onChange({ ...step, question })}
        value={step.question}
      />
      <StepTextField
        id={`${step.id}-statement`}
        label="판정할 진술"
        multiline
        onChange={(statement) => onChange({ ...step, statement })}
        value={step.statement}
      />
      <StepJsonField
        id={`${step.id}-correct`}
        label="정답 (true 또는 false)"
        onCommit={(correct) => {
          const changed = parseEditorStepChange(step, { correct })
          if (changed?.type !== "TRUE_FALSE") return false
          onChange(changed)
          return true
        }}
        value={step.correct}
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
