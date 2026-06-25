import type { AdminCourseDetail } from "@/lib/api/admin-api"
import { Card, CardContent } from "@workspace/ui/components/ui/card"
import { SectionHeader } from "@workspace/ui/components/ui/section-header"
import { Surface } from "@workspace/ui/components/ui/surface"

type Lesson = AdminCourseDetail["units"][number]["lessons"][number]

export function LessonPreview({ lesson }: { readonly lesson: Lesson }) {
  return (
    <Surface variant="panel">
      <SectionHeader
        title="학습자 미리보기"
        description="저장 전 학습자 시작 화면의 핵심 정보를 확인합니다."
      />
      <Card>
        <CardContent className="grid gap-2">
          <span className="text-label-sm font-bold text-fg-muted">
            시작 화면
          </span>
          <strong className="text-title-xl font-black text-fg-default">
            {lesson.title}
          </strong>
          <p className="m-0 text-body-sm font-semibold text-fg-muted">
            {lesson.description}
          </p>
          <small className="text-label-sm font-bold text-fg-muted">
            {lesson.estimatedMinutes}분 · {lesson.steps.length}개 스텝
          </small>
        </CardContent>
      </Card>
    </Surface>
  )
}
