import type { ReactNode } from "react"

import type { AdminApiResult } from "@/lib/api/api-result"
import type { AdminDashboard } from "@/lib/api/admin-api"
import {
  BookOpenIcon,
  CheckCircleIcon,
  UserPlusIcon,
  UsersIcon,
} from "@workspace/ui/components/icons"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { PageHeader } from "@workspace/ui/components/ui/page-header"
import { StatCard, StatGrid } from "@workspace/ui/components/ui/stat-card"

export function AdminDashboardPage({
  dashboardResult,
}: {
  readonly dashboardResult: AdminApiResult<AdminDashboard>
}) {
  if (dashboardResult.status === "error") {
    return (
      <>
        <PageHeader
          description="학습자 활동과 콘텐츠 상태를 한눈에 확인합니다."
          title="대시보드"
        />
        <Alert role="alert" tone="danger">
          <AlertDescription>{dashboardResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  const { metrics } = dashboardResult.value

  return (
    <>
      <PageHeader description="글결 서비스 현황 한눈에 보기" title="대시보드" />
      <StatGrid aria-label="주요 지표">
        <MetricCard
          icon={<UsersIcon aria-hidden="true" size={19} />}
          label="총 사용자"
          value={metrics.totalUsers.toLocaleString("ko-KR")}
          detail={`활성 ${metrics.activeUsersLast7Days.toLocaleString("ko-KR")}명 (최근 7일)`}
        />
        <MetricCard
          icon={<UserPlusIcon aria-hidden="true" size={19} />}
          label="신규 가입"
          value={`+${metrics.signupsLast7Days.toLocaleString("ko-KR")}`}
          detail={`오늘 ${metrics.signupsToday.toLocaleString("ko-KR")}명`}
        />
        <MetricCard
          icon={<CheckCircleIcon aria-hidden="true" size={19} />}
          label="총 레슨 완료"
          value={metrics.completedLessons.toLocaleString("ko-KR")}
          detail="누적 완료 수"
        />
        <MetricCard
          icon={<BookOpenIcon aria-hidden="true" size={19} />}
          label="콘텐츠"
          value={metrics.activeLessons.toLocaleString("ko-KR")}
          detail={`${metrics.activeCourses.toLocaleString("ko-KR")}개 강의의 레슨`}
        />
      </StatGrid>
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
  readonly icon: ReactNode
  readonly label: string
  readonly value: string
}) {
  return <StatCard detail={detail} icon={icon} label={label} value={value} />
}
