import type { EditorStep } from "@/features/courses/course-editor/step-forms/shared/editor-step"
import { Badge } from "@workspace/ui/components/ui/badge"

export type StepFormProps<TType extends EditorStep["type"]> = {
  readonly step: Extract<EditorStep, { readonly type: TType }>
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
