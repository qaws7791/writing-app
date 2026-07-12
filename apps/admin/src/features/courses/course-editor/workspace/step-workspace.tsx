import type { EditorStepParseResult } from "@/features/courses/course-editor/step-forms/shared/editor-step"
import { renderStepForm } from "@/features/courses/course-editor/step-forms/step-form-registry"
import { SectionHeader } from "@workspace/ui/components/ui/section-header"
import { Surface } from "@workspace/ui/components/ui/surface"

export function StepWorkspace({
  steps,
}: {
  readonly steps: readonly EditorStepParseResult[]
}) {
  return (
    <Surface variant="panel">
      <SectionHeader
        title="스텝 편집"
        description="표준 10개 스텝 타입별 필드를 확인합니다."
      />
      <ol aria-label="스텝 편집 폼" className="grid list-none gap-4 p-0">
        {steps.map((result) => (
          <li key={result.state === "valid" ? result.step.id : result.id}>
            {result.state === "valid" ? (
              renderStepForm(result.step)
            ) : (
              <InvalidStepNotice result={result} />
            )}
          </li>
        ))}
      </ol>
    </Surface>
  )
}

function InvalidStepNotice({
  result,
}: {
  readonly result: Extract<EditorStepParseResult, { readonly state: "invalid" }>
}) {
  return (
    <article
      aria-readonly="true"
      className="grid gap-2 rounded-card border border-destructive/50 bg-destructive/5 p-4"
      role="alert"
    >
      <strong>손상된 {result.rawType} 스텝을 편집할 수 없습니다.</strong>
      <span>{result.message}</span>
      <small>{result.id}</small>
    </article>
  )
}
