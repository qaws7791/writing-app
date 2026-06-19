import type { AdminCourseDetail } from "@/lib/api/admin-api"

export type EditorStep =
  AdminCourseDetail["units"][number]["lessons"][number]["steps"][number]

export type StepFormComponent = (props: {
  readonly step: EditorStep
}) => React.ReactNode

export function readStepContent(step: EditorStep): Record<string, unknown> {
  const parsed = JSON.parse(step.contentJson) as unknown
  if (isStepContentRecord(parsed)) {
    return parsed
  }

  throw new Error(`레슨 스텝 contentJson은 객체여야 합니다. stepId=${step.id}`)
}

function isStepContentRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function StepFormShell({
  children,
  step,
}: {
  readonly children: React.ReactNode
  readonly step: EditorStep
}) {
  return (
    <article className="step-form-card">
      <header>
        <strong>{step.type}</strong>
        <span>{step.id}</span>
      </header>
      {children}
    </article>
  )
}
