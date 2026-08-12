import {
  parseEditorStepChange,
  StepFormShell,
  StepJsonField,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

export function OrderStepForm({ onChange, step }: StepFormProps<"ORDER">) {
  const commitJson = (patch: Readonly<Record<string, unknown>>): boolean => {
    const changed = parseEditorStepChange(step, patch)
    if (changed?.type !== "ORDER") return false
    onChange(changed)
    return true
  }

  return (
    <StepFormShell step={step}>
      <StepTextField
        id={`${step.id}-title`}
        label="제목"
        onChange={(title) => onChange({ ...step, title })}
        value={step.title}
      />
      <StepJsonField
        id={`${step.id}-items`}
        label="정렬 항목"
        onCommit={(items) => commitJson({ items })}
        value={step.items}
      />
      <StepJsonField
        id={`${step.id}-item-ids`}
        label="항목 ID"
        onCommit={(itemIds) => commitJson({ itemIds })}
        value={step.itemIds}
      />
      <StepJsonField
        id={`${step.id}-correct`}
        label="정답 순서"
        onCommit={(correct) => commitJson({ correct })}
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
