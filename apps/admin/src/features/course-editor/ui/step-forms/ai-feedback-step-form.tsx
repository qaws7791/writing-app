import {
  parseEditorStepChange,
  StepBooleanField,
  StepFormShell,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

export function AiFeedbackStepForm({
  onChange,
  step,
}: StepFormProps<"AI_FEEDBACK">) {
  return (
    <StepFormShell step={step}>
      <StepTextField
        id={`${step.id}-target`}
        label="대상 쓰기 스텝 ID"
        onChange={(target) => {
          const changed = parseEditorStepChange(step, { target })
          if (changed?.type === "AI_FEEDBACK") onChange(changed)
        }}
        value={step.target}
      />
      <StepTextField
        id={`${step.id}-focus`}
        label="코칭 초점"
        multiline
        onChange={(focus) => onChange({ ...step, focus })}
        value={step.focus}
      />
      <StepTextField
        id={`${step.id}-feedback`}
        label="피드백 안내"
        multiline
        onChange={(feedback) => onChange({ ...step, feedback })}
        value={step.feedback}
      />
      <StepBooleanField
        checked={step.allowRetry}
        id={`${step.id}-allow-retry`}
        label="재시도 허용"
        onChange={(allowRetry) => onChange({ ...step, allowRetry })}
      />
    </StepFormShell>
  )
}
