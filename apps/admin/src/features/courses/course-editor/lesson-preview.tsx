import type { AdminCourseDetailDto } from "@workspace/contracts/admin"

type Lesson = AdminCourseDetailDto["units"][number]["lessons"][number]

export function LessonPreview({ lesson }: { readonly lesson: Lesson }) {
  return (
    <section className="admin-panel">
      <div className="admin-section-heading">
        <h2>학습자 미리보기</h2>
        <p>저장 전 학습자 시작 화면의 핵심 정보를 확인합니다.</p>
      </div>
      <div className="lesson-preview-card">
        <span>시작 화면</span>
        <strong>{lesson.title}</strong>
        <p>{lesson.description}</p>
        <small>
          {lesson.estimatedMinutes}분 · {lesson.steps.length}개 스텝
        </small>
      </div>
    </section>
  )
}
