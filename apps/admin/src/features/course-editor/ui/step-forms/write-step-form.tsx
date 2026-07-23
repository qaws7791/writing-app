import {
  parseEditorStepChange,
  StepBooleanField,
  StepFormShell,
  StepNumberField,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

const optionalTextFields = [
  ["title", "제목"],
  ["guide", "안내"],
  ["badge", "보조 라벨"],
  ["claim", "대상 주장"],
  ["context", "맥락"],
  ["mode", "쓰기 모드"],
  ["placeholder", "입력 안내"],
  ["prompt", "프롬프트"],
  ["reference", "참고 원문"],
  ["sample", "참조 답안"],
  ["structure", "구조 가이드"],
  ["topic", "주제"],
] as const

export function WriteStepForm({ onChange, step }: StepFormProps<"WRITE">) {
  const commitNumber = (
    field: "goal" | "max" | "min",
    value: number | undefined
  ): boolean => {
    const changed = parseEditorStepChange(step, { [field]: value })
    if (changed?.type !== "WRITE") return false
    onChange(changed)
    return true
  }

  return (
    <StepFormShell step={step}>
      <div className="grid gap-4 md:grid-cols-3">
        <StepNumberField
          id={`${step.id}-min`}
          label="최소 글자 수"
          onCommit={(value) => commitNumber("min", value)}
          value={step.min}
        />
        <StepNumberField
          id={`${step.id}-goal`}
          label="목표 글자 수"
          onCommit={(value) => commitNumber("goal", value)}
          optional
          value={step.goal}
        />
        <StepNumberField
          id={`${step.id}-max`}
          label="최대 글자 수"
          onCommit={(value) => commitNumber("max", value)}
          optional
          value={step.max}
        />
      </div>
      {optionalTextFields.map(([field, label]) => (
        <StepTextField
          id={`${step.id}-${field}`}
          key={field}
          label={label}
          multiline={[
            "claim",
            "context",
            "guide",
            "reference",
            "sample",
            "structure",
          ].includes(field)}
          onChange={(value) =>
            onChange({
              ...step,
              [field]: value === "" ? undefined : value,
            })
          }
          value={step[field]}
        />
      ))}
      <StepBooleanField
        checked={step.draft ?? false}
        id={`${step.id}-draft`}
        label="드래프트 저장 보조 행동 표시"
        onChange={(draft) => onChange({ ...step, draft })}
      />
    </StepFormShell>
  )
}
