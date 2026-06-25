import { AdminHeader } from "@/components/admin-header"
import { CurriculumMap } from "@/features/courses/course-editor/preview/curriculum-map"
import { LessonPreview } from "@/features/courses/course-editor/preview/lesson-preview"
import { LessonWorkspace } from "@/features/courses/course-editor/workspace/lesson-workspace"
import { StepWorkspace } from "@/features/courses/course-editor/workspace/step-workspace"
import type { AdminCourseDetail } from "@/lib/api/admin-api"
import { Input } from "@workspace/ui/components/ui/input"
import { Textarea } from "@workspace/ui/components/ui/textarea"

export function CourseEditorShell({
  course,
}: {
  readonly course: AdminCourseDetail
}) {
  const firstUnit = course.units[0] ?? null
  const firstLesson = firstUnit?.lessons[0] ?? null

  return (
    <>
      <AdminHeader
        description="코스 정보, 레슨 구성, 스텝 콘텐츠를 저장 없이 확인합니다."
        title="코스 미리보기"
      />
      <fieldset className="course-editor__read-only" disabled>
        <legend>읽기 전용 미리보기</legend>
        <section className="course-editor">
          <aside className="course-editor__summary">
            <div className="admin-panel">
              <div className="admin-section-heading">
                <h2>코스 정보</h2>
                <p>revision {course.revision}</p>
              </div>
              <label className="admin-form-field">
                <span>코스 제목</span>
                <Input defaultValue={course.title} />
              </label>
              <label className="admin-form-field">
                <span>카테고리</span>
                <Input defaultValue={course.category} />
              </label>
              <label className="admin-form-field">
                <span>설명</span>
                <Textarea defaultValue={course.description} />
              </label>
            </div>
            <CurriculumMap course={course} />
          </aside>
          <main className="course-editor__workspace">
            {firstLesson === null ? (
              <section className="admin-panel">레슨이 없습니다.</section>
            ) : (
              <>
                <LessonWorkspace lesson={firstLesson} />
                <StepWorkspace steps={firstLesson.steps} />
                <LessonPreview lesson={firstLesson} />
              </>
            )}
          </main>
        </section>
      </fieldset>
    </>
  )
}
