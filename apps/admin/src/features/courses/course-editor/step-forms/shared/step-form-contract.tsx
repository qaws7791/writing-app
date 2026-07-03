import type { AdminCourseDetail } from "@/lib/api/admin-api"
import { Badge } from "@workspace/ui/components/ui/badge"

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
    <article className="grid gap-4 rounded-card border border-border/50 bg-background p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="secondary">{step.type}</Badge>
        <span className="text-label-sm font-semibold text-muted-foreground">
          {step.id}
        </span>
      </header>
      {children}
    </article>
  )
}
