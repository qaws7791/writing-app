import {
  parseEditorStepChange,
  StepBooleanField,
  StepFormShell,
  StepNumberField,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

export function AiFeedbackStepForm({
  onChange,
  step,
}: StepFormProps<"AI_FEEDBACK">) {
  const commitNumber = (
    field: "score" | "scoreMax",
    value: number | undefined
  ): boolean => {
    const changed = parseEditorStepChange(step, { [field]: value })
    if (changed?.type !== "AI_FEEDBACK") return false
    onChange(changed)
    return true
  }

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
        label="평가 초점"
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
      <div className="grid gap-4 md:grid-cols-2">
        <StepNumberField
          id={`${step.id}-score`}
          label="기본 점수"
          onCommit={(value) => commitNumber("score", value)}
          value={step.score}
        />
        <StepNumberField
          id={`${step.id}-score-max`}
          label="최대 점수"
          onCommit={(value) => commitNumber("scoreMax", value)}
          value={step.scoreMax}
        />
      </div>
      <StepBooleanField
        checked={step.showScore}
        id={`${step.id}-show-score`}
        label="점수 표시"
        onChange={(showScore) => onChange({ ...step, showScore })}
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
