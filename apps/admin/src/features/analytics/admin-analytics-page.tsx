import { AdminHeader } from "@/components/admin-header"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminAnalyticsDto,
  AdminLessonAnalyticsPageDto,
} from "@workspace/contracts/admin"

export function AdminAnalyticsPage({
  analyticsResult,
  lessonAnalyticsResult,
}: {
  readonly analyticsResult: AdminApiResult<AdminAnalyticsDto>
  readonly lessonAnalyticsResult: AdminApiResult<AdminLessonAnalyticsPageDto>
}) {
  if (analyticsResult.status === "error") {
    return (
      <>
        <AdminHeader
          description="가입, 완료, 이탈 지표를 분석합니다."
          title="분석"
        />
        <section className="admin-alert" role="alert">
          {analyticsResult.error.message}
        </section>
      </>
    )
  }

  const lessonRows =
    lessonAnalyticsResult.status === "ok"
      ? lessonAnalyticsResult.value.items
      : []

  return (
    <>
      <AdminHeader
        description="가입, 완료, 이탈 지표를 분석합니다."
        title="분석"
      />
      <section className="analytics-grid">
        <div className="admin-panel">
          <div className="admin-section-heading">
            <h2>최근 30일 가입 추이</h2>
            <p>일별 가입과 레슨 완료를 함께 봅니다.</p>
          </div>
          <ol className="analytics-series">
            {analyticsResult.value.dailySeries.map((point) => (
              <li key={point.date}>
                <span>{point.date}</span>
                <strong>
                  가입 {point.signups} · 완료 {point.completions}
                </strong>
              </li>
            ))}
          </ol>
        </div>
        <div className="admin-panel">
          <div className="admin-section-heading">
            <h2>연속 학습일 분포</h2>
            <p>현재 streak bucket입니다.</p>
          </div>
          <ol className="analytics-buckets">
            {analyticsResult.value.streakBuckets.map((bucket) => (
              <li key={bucket.label}>
                <span>{bucket.label}</span>
                <strong>{bucket.count}명</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="admin-panel">
        <div className="admin-section-heading">
          <h2>레슨별 완료율</h2>
          <p>완료율과 이탈률을 기준으로 개선 대상을 찾습니다.</p>
        </div>
        <div className="admin-table-wrap">
          <table aria-label="레슨별 분석" className="admin-table">
            <thead>
              <tr>
                <th scope="col">레슨</th>
                <th scope="col">코스</th>
                <th scope="col">시작</th>
                <th scope="col">완료</th>
                <th scope="col">완료율</th>
                <th scope="col">이탈률</th>
              </tr>
            </thead>
            <tbody>
              {lessonRows.map((lesson) => (
                <tr key={lesson.lessonId}>
                  <td>{lesson.lessonTitle}</td>
                  <td>{lesson.courseTitle}</td>
                  <td>{lesson.started}</td>
                  <td>{lesson.completed}</td>
                  <td>{lesson.completionRate}%</td>
                  <td>{lesson.dropOffRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
