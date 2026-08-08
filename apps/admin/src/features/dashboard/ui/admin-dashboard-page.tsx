import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import type { AdminDashboard } from "@/features/dashboard/model/admin-dashboard"
import {
  BarChartIcon,
  CheckCircleIcon,
  FileTextIcon,
  FlameIcon,
  UserPlusIcon,
} from "@workspace/ui/components/icons"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { PageHeader } from "@workspace/ui/components/ui/page-header"
import { StatCard, StatGrid } from "@workspace/ui/components/ui/stat-card"

export function AdminDashboardPage({
  dashboardResult,
}: {
  readonly dashboardResult: AdminRequestResult<AdminDashboard>
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

  const { activeWindow, asOfDate, metrics } = dashboardResult.value

  return (
    <>
      <DashboardHeading asOfDate={asOfDate} />
      <StatGrid aria-label="주요 지표" className="lg:grid-cols-3">
        <StatCard
          aria-label="활성화율"
          detail={`${formatCount(metrics.activationRate.numerator)} / ${formatCount(metrics.activationRate.denominator)}명 첫 시작 · ${asOfDate} 기준`}
          icon={<UserPlusIcon aria-hidden="true" size={20} />}
          label="활성화율"
          value={formatRate(
            metrics.activationRate.percentage,
            metrics.activationRate.status
          )}
        />
        <StatCard
          aria-label="7일 내 재방문"
          detail={`${formatCount(metrics.d7ReturnRate.numerator)} / ${formatCount(metrics.d7ReturnRate.denominator)}명 · ${metrics.d7ReturnRate.matureCohortThrough}까지`}
          icon={<BarChartIcon aria-hidden="true" size={20} />}
          label="7일 내 재방문"
          value={formatRate(
            metrics.d7ReturnRate.percentage,
            metrics.d7ReturnRate.status
          )}
        />
        <StatCard
          aria-label="최근 7일 활성"
          detail={`${activeWindow.from}–${activeWindow.to}`}
          icon={<FlameIcon aria-hidden="true" size={20} />}
          label="최근 7일 활성"
          value={formatCount(metrics.activeUsersLast7Days)}
        />
        <StatCard
          aria-label="자기 점검 시작률"
          detail={`${formatCount(metrics.writingSelfCheckStartRate.numerator)} / ${formatCount(metrics.writingSelfCheckStartRate.denominator)}개 글`}
          icon={<FileTextIcon aria-hidden="true" size={20} />}
          label="자기 점검 시작률"
          value={formatRate(
            metrics.writingSelfCheckStartRate.percentage,
            metrics.writingSelfCheckStartRate.status
          )}
        />
        <StatCard
          aria-label="점검 뒤 수정률"
          detail={`${formatCount(metrics.writingRevisionAfterSelfCheckRate.numerator)} / ${formatCount(metrics.writingRevisionAfterSelfCheckRate.denominator)}개 점검 시작 글`}
          icon={<CheckCircleIcon aria-hidden="true" size={20} />}
          label="점검 뒤 수정률"
          value={formatRate(
            metrics.writingRevisionAfterSelfCheckRate.percentage,
            metrics.writingRevisionAfterSelfCheckRate.status
          )}
        />
      </StatGrid>
    </>
  )
}

function DashboardHeading({ asOfDate }: { readonly asOfDate?: string }) {
  return (
    <PageHeader
      description={
        asOfDate === undefined
          ? "첫 시작과 7일 재방문을 포함한 핵심 운영 지표입니다."
          : `${asOfDate} 기준 · 첫 시작과 7일 재방문을 포함한 핵심 운영 지표입니다.`
      }
      title="대시보드"
    />
  )
}

function formatCount(value: number): string {
  return value.toLocaleString("ko-KR")
}

function formatRate(
  percentage: number | null,
  status: "available" | "empty" | "immature"
): string {
  if (percentage !== null) return `${percentage.toLocaleString("ko-KR")}%`
  return status === "immature" ? "집계 중" : "표본 없음"
}
