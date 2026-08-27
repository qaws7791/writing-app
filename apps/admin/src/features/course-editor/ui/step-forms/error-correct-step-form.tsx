import {
  parseEditorStepChange,
  StepFormShell,
  StepJsonField,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

export function ErrorCorrectStepForm({
  onChange,
  step,
}: StepFormProps<"ERROR_CORRECT">) {
  const commitJson = (patch: Readonly<Record<string, unknown>>): boolean => {
    const changed = parseEditorStepChange(step, patch)
    if (changed?.type !== "ERROR_CORRECT") return false
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
        id={`${step.id}-segments`}
        label="문장 구간"
        onCommit={(segments) => commitJson({ segments })}
        value={step.segments}
      />
      <StepJsonField
        id={`${step.id}-segment-ids`}
        label="구간 ID"
        onCommit={(segmentIds) => commitJson({ segmentIds })}
        value={step.segmentIds}
      />
      <StepTextField
        id={`${step.id}-correct-segment`}
        label="오류 구간 ID"
        onChange={(correctSegment) => onChange({ ...step, correctSegment })}
        value={step.correctSegment}
      />
      <StepJsonField
        id={`${step.id}-fixes`}
        label="교정안"
        onCommit={(fixes) => commitJson({ fixes })}
        value={step.fixes}
      />
      <StepJsonField
        id={`${step.id}-fix-ids`}
        label="교정안 ID"
        onCommit={(fixIds) => commitJson({ fixIds })}
        value={step.fixIds}
      />
      <StepTextField
        id={`${step.id}-correct-fix`}
        label="정답 교정안 ID"
        onChange={(correctFix) => onChange({ ...step, correctFix })}
        value={step.correctFix}
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
