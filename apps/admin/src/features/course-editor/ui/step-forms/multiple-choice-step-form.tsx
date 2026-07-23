import {
  parseEditorStepChange,
  StepFormShell,
  StepJsonField,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

export function MultipleChoiceStepForm({
  onChange,
  step,
}: StepFormProps<"MULTIPLE_CHOICE">) {
  return (
    <StepFormShell step={step}>
      <StepTextField
        id={`${step.id}-question`}
        label="질문"
        multiline
        onChange={(question) => onChange({ ...step, question })}
        value={step.question}
      />
      <StepJsonField
        id={`${step.id}-options`}
        label="선택지"
        onCommit={(options) => {
          const changed = parseEditorStepChange(step, { options })
          if (changed?.type !== "MULTIPLE_CHOICE") return false
          onChange(changed)
          return true
        }}
        value={step.options}
      />
      <StepTextField
        id={`${step.id}-correct`}
        label="정답 선택지 ID"
        onChange={(correct) => onChange({ ...step, correct })}
        value={step.correct}
      />
      <StepTextField
        id={`${step.id}-explanation`}
        label="해설"
        multiline
        onChange={(explanation) => onChange({ ...step, explanation })}
        value={step.explanation}
      />
      <StepTextField
        id={`${step.id}-wrong`}
        label="오답 안내"
        multiline
        onChange={(wrong) =>
          onChange({ ...step, wrong: wrong === "" ? undefined : wrong })
        }
        value={step.wrong}
      />
    </StepFormShell>
  )
}
