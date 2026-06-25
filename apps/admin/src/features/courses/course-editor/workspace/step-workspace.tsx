import { renderStepForm } from "@/features/courses/course-editor/step-forms/step-form-registry"
import type { AdminCourseDetail } from "@/lib/api/admin-api"
import { SectionHeader } from "@workspace/ui/components/ui/section-header"
import { Surface } from "@workspace/ui/components/ui/surface"

type Step =
  AdminCourseDetail["units"][number]["lessons"][number]["steps"][number]

export function StepWorkspace({ steps }: { readonly steps: readonly Step[] }) {
  return (
    <Surface variant="panel">
      <SectionHeader
        title="스텝 편집"
        description="표준 10개 스텝 타입별 필드를 확인합니다."
      />
      <ol aria-label="스텝 편집 폼" className="grid list-none gap-4 p-0">
        {steps.map((step) => (
          <li key={step.id}>{renderStepForm(step)}</li>
        ))}
      </ol>
    </Surface>
  )
}
