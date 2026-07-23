import {
  parseEditorStepChange,
  StepFormShell,
  StepJsonField,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

export function SelectStepForm({ onChange, step }: StepFormProps<"SELECT">) {
  const commitJson = (patch: Readonly<Record<string, unknown>>): boolean => {
    const changed = parseEditorStepChange(step, patch)
    if (changed?.type !== "SELECT") return false
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
      <StepJsonField
        id={`${step.id}-correct`}
        label="정답 index"
        onCommit={(correct) => commitJson({ correct })}
        value={step.correct}
      />
      <StepTextField
        id={`${step.id}-layout`}
        label="레이아웃"
        onChange={(layout) =>
          onChange({ ...step, layout: layout === "" ? undefined : layout })
        }
        value={step.layout}
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
