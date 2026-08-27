import {
  parseEditorStepChange,
  StepFormShell,
  StepJsonField,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

export function SentenceBuildStepForm({
  onChange,
  step,
}: StepFormProps<"SENTENCE_BUILD">) {
  const commitJson = (patch: Readonly<Record<string, unknown>>): boolean => {
    const changed = parseEditorStepChange(step, patch)
    if (changed?.type !== "SENTENCE_BUILD") return false
    onChange(changed)
    return true
  }

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
        id={`${step.id}-tiles`}
        label="어절 타일"
        onCommit={(tiles) => commitJson({ tiles })}
        value={step.tiles}
      />
      <StepJsonField
        id={`${step.id}-tile-ids`}
        label="타일 ID"
        onCommit={(tileIds) => commitJson({ tileIds })}
        value={step.tileIds}
      />
      <StepJsonField
        id={`${step.id}-correct`}
        label="정답 타일 ID 순서"
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
