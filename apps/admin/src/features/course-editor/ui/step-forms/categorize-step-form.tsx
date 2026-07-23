import {
  parseEditorStepChange,
  StepFormShell,
  StepJsonField,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

export function CategorizeStepForm({
  onChange,
  step,
}: StepFormProps<"CATEGORIZE">) {
  const commitJson = (patch: Readonly<Record<string, unknown>>): boolean => {
    const changed = parseEditorStepChange(step, patch)
    if (changed?.type !== "CATEGORIZE") return false
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
      <StepTextField
        id={`${step.id}-guide`}
        label="안내"
        multiline
        onChange={(guide) => onChange({ ...step, guide })}
        value={step.guide}
      />
      <StepJsonField
        id={`${step.id}-categories`}
        label="카테고리"
        onCommit={(categories) => commitJson({ categories })}
        value={step.categories}
      />
      <StepJsonField
        id={`${step.id}-items`}
        label="분류 항목"
        onCommit={(items) => commitJson({ items })}
        value={step.items}
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
