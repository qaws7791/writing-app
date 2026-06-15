import type { AdminCourseDetailDto } from "@workspace/core/admin"

type Lesson = AdminCourseDetailDto["units"][number]["lessons"][number]

export function LessonWorkspace({ lesson }: { readonly lesson: Lesson }) {
  return (
    <section className="admin-panel">
      <div className="admin-section-heading">
        <h2>레슨 정보</h2>
        <p>기본 정보와 학습자 시작 화면에 보일 요약입니다.</p>
      </div>
      <div className="course-editor-form-grid">
        <label className="admin-form-field">
          <span>레슨 제목</span>
          <input defaultValue={lesson.title} />
        </label>
        <label className="admin-form-field">
          <span>예상 시간</span>
          <input
            aria-label="예상 시간"
            defaultValue={lesson.estimatedMinutes}
            min={1}
            type="number"
          />
        </label>
      </div>
      <label className="admin-form-field">
        <span>레슨 설명</span>
        <textarea defaultValue={lesson.description ?? ""} />
      </label>
      <label className="admin-form-field">
        <span>레슨 요약</span>
        <textarea
          aria-label="레슨 요약"
          defaultValue={JSON.stringify(lesson.summary, null, 2)}
        />
      </label>
    </section>
  )
}
