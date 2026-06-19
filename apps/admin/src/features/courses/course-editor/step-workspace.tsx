import { renderStepForm } from "@/features/courses/course-editor/step-form-registry"
import type { AdminCourseDetail } from "@/lib/api/admin-api"

type Step =
  AdminCourseDetail["units"][number]["lessons"][number]["steps"][number]

export function StepWorkspace({ steps }: { readonly steps: readonly Step[] }) {
  return (
    <section className="admin-panel">
      <div className="admin-section-heading">
        <h2>스텝 편집</h2>
        <p>Kwep 10개 스텝 타입별 필드를 확인합니다.</p>
      </div>
      <ol aria-label="스텝 편집 폼" className="step-form-list">
        {steps.map((step) => (
          <li key={step.id}>{renderStepForm(step)}</li>
        ))}
      </ol>
    </section>
  )
}
