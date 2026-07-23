import {
  parseEditorStepChange,
  StepFormShell,
  StepJsonField,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

export function FillBlankStepForm({
  onChange,
  step,
}: StepFormProps<"FILL_BLANK">) {
  const commitJson = (patch: Readonly<Record<string, unknown>>): boolean => {
    const changed = parseEditorStepChange(step, patch)
    if (changed?.type !== "FILL_BLANK") return false
    onChange(changed)
    return true
  }

  return (
    <StepFormShell step={step}>
      <StepTextField
        id={`${step.id}-template`}
        label="빈칸 문장"
        multiline
        onChange={(template) => onChange({ ...step, template })}
        value={step.template}
      />
      <StepJsonField
        id={`${step.id}-words`}
        label="표시 단어"
        onCommit={(words) => commitJson({ words })}
        value={step.words}
      />
      <StepJsonField
        id={`${step.id}-word-ids`}
        label="단어 ID"
        onCommit={(wordIds) => commitJson({ wordIds })}
        value={step.wordIds}
      />
      <StepJsonField
        id={`${step.id}-answer`}
        label="정답 ID"
        onCommit={(answer) => commitJson({ answer })}
        value={step.answer}
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
