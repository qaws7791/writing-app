import type { AdminCourseDetail } from "@/features/course-editor/model/admin-course-editor"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import { SectionHeader } from "@workspace/ui/components/ui/section-header"
import { Surface } from "@workspace/ui/components/ui/surface"
import { Textarea } from "@workspace/ui/components/ui/textarea"

type Lesson = AdminCourseDetail["units"][number]["lessons"][number]

export function LessonWorkspace({ lesson }: { readonly lesson: Lesson }) {
  return (
    <Surface variant="panel">
      <SectionHeader
        title="레슨 정보"
        description="기본 정보와 학습자 시작 화면에 보일 요약입니다."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="lesson-preview-title">레슨 제목</FieldLabel>
          <Input id="lesson-preview-title" defaultValue={lesson.title} />
        </Field>
        <Field>
          <FieldLabel htmlFor="lesson-preview-estimated-minutes">
            예상 시간
          </FieldLabel>
          <Input
            aria-label="예상 시간"
            defaultValue={lesson.estimatedMinutes}
            id="lesson-preview-estimated-minutes"
            min={1}
            type="number"
          />
        </Field>
      </div>
      <Field className="mt-4">
        <FieldLabel htmlFor="lesson-preview-description">레슨 설명</FieldLabel>
        <Textarea
          id="lesson-preview-description"
          defaultValue={lesson.description ?? ""}
        />
      </Field>
      <Field className="mt-4">
        <FieldLabel htmlFor="lesson-preview-summary">레슨 요약</FieldLabel>
        <Textarea
          aria-label="레슨 요약"
          defaultValue={JSON.stringify(lesson.summary, null, 2)}
          id="lesson-preview-summary"
        />
      </Field>
    </Surface>
  )
}
