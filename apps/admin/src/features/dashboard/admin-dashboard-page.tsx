import { Activity, BookOpen, CheckCircle2, Users } from "lucide-react"

import { AdminHeader } from "@/components/admin-header"
import type { AdminApiResult } from "@/lib/api/api-result"
import type { AdminDashboard } from "@/lib/api/admin-api"

export function AdminDashboardPage({
  dashboardResult,
}: {
  readonly dashboardResult: AdminApiResult<AdminDashboard>
}) {
  if (dashboardResult.status === "error") {
    return (
      <>
        <AdminHeader
          description="학습자 활동과 콘텐츠 상태를 한눈에 확인합니다."
          title="대시보드"
        />
        <section className="admin-alert" role="alert">
          {dashboardResult.error.message}
        </section>
      </>
    )
  }

  const { metrics, recentActivities } = dashboardResult.value

  return (
    <>
      <AdminHeader
        description="학습자 활동과 콘텐츠 상태를 한눈에 확인합니다."
        title="대시보드"
      />
      <section className="admin-metric-grid" aria-label="주요 지표">
        <MetricCard
          icon={<Users aria-hidden="true" size={19} />}
          label="총 사용자"
          value={metrics.totalUsers.toLocaleString("ko-KR")}
        />
        <MetricCard
          icon={<Activity aria-hidden="true" size={19} />}
          label="최근 7일 활성"
          value={metrics.activeUsersLast7Days.toLocaleString("ko-KR")}
          detail={`오늘 가입 ${metrics.signupsToday}명 · 7일 가입 ${metrics.signupsLast7Days}명`}
        />
        <MetricCard
          icon={<CheckCircle2 aria-hidden="true" size={19} />}
          label="누적 완료 레슨"
          value={metrics.completedLessons.toLocaleString("ko-KR")}
        />
        <MetricCard
          icon={<BookOpen aria-hidden="true" size={19} />}
          label="콘텐츠"
          value={`${metrics.activeCourses}개 코스 · ${metrics.activeLessons}개 레슨`}
        />
      </section>
      <section className="admin-dashboard-grid">
        <div className="admin-panel">
          <div className="admin-section-heading">
            <h2>최근 활동</h2>
            <p>마지막 학습일 기준 최근 학습자입니다.</p>
          </div>
          <ul aria-label="최근 활동" className="admin-activity-list">
            {recentActivities.length === 0 ? (
              <li className="admin-empty">최근 활동이 없습니다.</li>
            ) : (
              recentActivities.map((activity) => (
                <li key={activity.userId}>
                  <div>
                    <strong>{activity.name}</strong>
                    <span>{activity.email}</span>
                  </div>
                  <div>
                    <strong>{activity.currentStreakDays}일 연속</strong>
                    <span>{activity.lastActiveDate ?? "활동 없음"}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="admin-panel">
          <div className="admin-section-heading">
            <h2>운영 흐름</h2>
            <p>활성 사용자와 완료 레슨의 균형을 빠르게 확인합니다.</p>
          </div>
          <div className="admin-bar-summary" aria-label="운영 흐름 차트">
            <Bar
              label="활성"
              value={metrics.activeUsersLast7Days}
              max={Math.max(metrics.totalUsers, 1)}
            />
            <Bar
              label="완료"
              value={metrics.completedLessons}
              max={Math.max(metrics.completedLessons, metrics.activeLessons, 1)}
            />
            <Bar
              label="콘텐츠"
              value={metrics.activeLessons}
              max={Math.max(metrics.completedLessons, metrics.activeLessons, 1)}
            />
          </div>
        </div>
      </section>
    </>
  )
}

function MetricCard({
  detail,
  icon,
  label,
  value,
}: {
  readonly detail?: string
  readonly icon: React.ReactNode
  readonly label: string
  readonly value: string
}) {
  return (
    <article className="admin-metric-card">
      <div className="admin-metric-card__icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail === undefined ? null : <small>{detail}</small>}
    </article>
  )
}

function Bar({
  label,
  max,
  value,
}: {
  readonly label: string
  readonly max: number
  readonly value: number
}) {
  const width = `${Math.max(4, Math.round((value / max) * 100))}%`

  return (
    <div className="admin-bar-summary__row">
      <span>{label}</span>
      <div>
        <i style={{ width }} />
      </div>
      <strong>{value.toLocaleString("ko-KR")}</strong>
    </div>
  )
}
