import Link from "next/link"

import {
  AdminCompletionTrendChart,
  AdminSignupTrendChart,
  AdminStreakDistributionChart,
} from "@/components/admin-charts"
import type { AdminApiResult } from "@/lib/api/api-result"
import type { AdminAnalytics, AdminDashboard } from "@/lib/api/admin-api"
import {
  BookOpenIcon,
  CheckCircleIcon,
  FlameIcon,
  UserPlusIcon,
  UsersIcon,
} from "@workspace/ui/components/icons"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { StatCard, StatGrid } from "@workspace/ui/components/ui/stat-card"

export function AdminDashboardPage({
  analyticsResult,
  dashboardResult,
}: {
  readonly analyticsResult: AdminApiResult<AdminAnalytics>
  readonly dashboardResult: AdminApiResult<AdminDashboard>
}) {
  if (dashboardResult.status === "error") {
    return (
      <>
        <DashboardHeading />
        <Alert role="alert" tone="danger">
          <AlertDescription>{dashboardResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  const { metrics, recentActivities } = dashboardResult.value
  const analytics =
    analyticsResult.status === "ok" ? analyticsResult.value : null

  return (
    <>
      <DashboardHeading />
      <StatGrid aria-label="주요 지표">
        <StatCard
          detail={`활성 ${metrics.activeUsersLast7Days.toLocaleString("ko-KR")}명 (최근 7일)`}
          icon={<UsersIcon aria-hidden="true" size={20} />}
          label="총 사용자"
          value={metrics.totalUsers.toLocaleString("ko-KR")}
        />
        <StatCard
          detail={`오늘 ${metrics.signupsToday.toLocaleString("ko-KR")}명`}
          icon={<UserPlusIcon aria-hidden="true" size={20} />}
          label="신규 가입"
          value={`+${metrics.signupsLast7Days.toLocaleString("ko-KR")}`}
        />
        <StatCard
          detail="누적 완료 수"
          icon={<CheckCircleIcon aria-hidden="true" size={20} />}
          label="총 레슨 완료"
          value={metrics.completedLessons.toLocaleString("ko-KR")}
        />
        <StatCard
          detail={`${metrics.activeCourses.toLocaleString("ko-KR")}개 강의의 레슨`}
          icon={<BookOpenIcon aria-hidden="true" size={20} />}
          label="콘텐츠"
          value={metrics.activeLessons.toLocaleString("ko-KR")}
        />
      </StatGrid>
      {analytics === null ? null : (
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <AdminSignupTrendChart data={analytics.dailySeries} />
          <AdminCompletionTrendChart data={analytics.dailySeries} />
        </section>
      )}
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        {analytics === null ? null : (
          <AdminStreakDistributionChart data={analytics.streakBuckets} />
        )}
        <RecentActivityPanel activities={recentActivities} />
      </section>
    </>
  )
}

function DashboardHeading() {
  return (
    <header className="mb-8">
      <h1 className="m-0 text-[2rem] font-bold text-foreground">대시보드</h1>
      <p className="mt-1 text-[1.0625rem] font-medium text-muted-foreground">
        글결 서비스 현황 한눈에 보기
      </p>
    </header>
  )
}

function RecentActivityPanel({
  activities,
}: {
  readonly activities: AdminDashboard["recentActivities"]
}) {
  return (
    <article className="rounded-4xl border border-surface-hover p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="m-0 text-[1.125rem] font-bold text-foreground">
          최근 활동
        </h2>
        <Link
          className="text-[0.875rem] font-bold text-muted-foreground transition-colors hover:text-foreground"
          href="/users"
        >
          전체 보기 →
        </Link>
      </div>
      <ul
        aria-label="최근 활동"
        className="m-0 flex list-none flex-col gap-3 p-0"
      >
        {activities.length === 0 ? (
          <li className="text-[0.9375rem] font-medium text-muted-foreground">
            최근 활동이 없습니다.
          </li>
        ) : (
          activities.map((activity) => (
            <li key={activity.userId}>
              <Link
                className="flex items-center justify-between gap-3 transition-opacity hover:opacity-70"
                href={`/users/${activity.userId}`}
              >
                <div className="min-w-0">
                  <div className="truncate text-[0.9375rem] font-bold text-foreground">
                    {activity.name}
                  </div>
                  <div className="truncate text-[0.8125rem] font-medium text-muted-foreground">
                    {activity.email}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-[0.8125rem] font-bold text-muted-foreground">
                  <FlameIcon aria-hidden="true" size={14} />
                  {activity.currentStreakDays}일
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </article>
  )
}
