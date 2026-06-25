import { CurriculumMap } from "@/features/courses/course-editor/preview/curriculum-map"
import { LessonPreview } from "@/features/courses/course-editor/preview/lesson-preview"
import { LessonWorkspace } from "@/features/courses/course-editor/workspace/lesson-workspace"
import { StepWorkspace } from "@/features/courses/course-editor/workspace/step-workspace"
import type { AdminCourseDetail } from "@/lib/api/admin-api"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { EmptyState } from "@workspace/ui/components/ui/empty-state"
import { Input } from "@workspace/ui/components/ui/input"
import { PageHeader } from "@workspace/ui/components/ui/page-header"
import { SectionHeader } from "@workspace/ui/components/ui/section-header"
import { Surface } from "@workspace/ui/components/ui/surface"
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
      <PageHeader
        description="코스 정보, 레슨 구성, 스텝 콘텐츠를 저장 없이 확인합니다."
        title="코스 미리보기"
      />
      <fieldset className="m-0 border-0 p-0" disabled>
        <legend className="sr-only">읽기 전용 미리보기</legend>
        <section className="grid grid-cols-[20rem_minmax(0,1fr)] gap-4 max-xl:grid-cols-1">
          <aside className="grid content-start gap-4">
            <Surface variant="panel">
              <SectionHeader
                title="코스 정보"
                description={`revision ${course.revision}`}
              />
              <Field>
                <FieldLabel htmlFor="course-preview-title">
                  코스 제목
                </FieldLabel>
                <Input id="course-preview-title" defaultValue={course.title} />
              </Field>
              <Field className="mt-4">
                <FieldLabel htmlFor="course-preview-category">
                  카테고리
                </FieldLabel>
                <Input
                  id="course-preview-category"
                  defaultValue={course.category}
                />
              </Field>
              <Field className="mt-4">
                <FieldLabel htmlFor="course-preview-description">
                  설명
                </FieldLabel>
                <Textarea
                  id="course-preview-description"
                  defaultValue={course.description}
                />
              </Field>
            </Surface>
            <CurriculumMap course={course} />
          </aside>
          <main className="grid content-start gap-4">
            {firstLesson === null ? (
              <EmptyState role="status" title="레슨이 없습니다." />
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
