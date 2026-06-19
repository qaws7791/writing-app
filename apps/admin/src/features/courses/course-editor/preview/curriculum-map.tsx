import type { AdminCourseDetail } from "@/lib/api/admin-api"

export function CurriculumMap({
  course,
}: {
  readonly course: AdminCourseDetail
}) {
  return (
    <section className="admin-panel">
      <div className="admin-section-heading">
        <h2>커리큘럼</h2>
        <p>유닛과 레슨 배치를 확인합니다.</p>
      </div>
      <ol className="course-editor-list">
        {course.units.map((unit) => (
          <li key={unit.id}>
            <strong>{unit.title}</strong>
            <ol>
              {unit.lessons.map((lesson) => (
                <li key={lesson.id}>{lesson.title}</li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </section>
  )
}
