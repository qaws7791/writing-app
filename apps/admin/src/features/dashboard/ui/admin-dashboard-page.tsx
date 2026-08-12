import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import type { AdminDashboard } from "@/features/dashboard/model/admin-dashboard"
import { AdminPageHeader } from "@/shared/ui/admin-page-header"
import {
  BarChartIcon,
  CheckCircleIcon,
  FileTextIcon,
  FlameIcon,
  UserPlusIcon,
} from "@workspace/ui/components/icons"
import {
  Alert,
  AlertDescription,
} from "@workspace/ui/components/primitives/alert"
import { Card, CardContent } from "@workspace/ui/components/primitives/card"

export function AdminDashboardPage({
  dashboardResult,
}: {
  readonly dashboardResult: AdminRequestResult<AdminDashboard>
}) {
  if (dashboardResult.status === "error") {
    return (
      <>
        <DashboardHeading />
        <Alert role="alert" variant="destructive">
          <AlertDescription>{dashboardResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  const { activeWindow, asOfDate, metrics } = dashboardResult.value

  return (
    <>
      <DashboardHeading asOfDate={asOfDate} />
      <section
        aria-label="주요 지표"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <DashboardMetric
          detail={`${formatCount(metrics.activationRate.numerator)} / ${formatCount(metrics.activationRate.denominator)}명 첫 시작 · ${asOfDate} 기준`}
          icon={<UserPlusIcon aria-hidden="true" size={20} />}
          label="활성화율"
          value={formatRate(
            metrics.activationRate.percentage,
            metrics.activationRate.status
          )}
        />
        <DashboardMetric
          detail={`${formatCount(metrics.d7ReturnRate.numerator)} / ${formatCount(metrics.d7ReturnRate.denominator)}명 · ${metrics.d7ReturnRate.matureCohortThrough}까지`}
          icon={<BarChartIcon aria-hidden="true" size={20} />}
          label="7일 내 재방문"
          value={formatRate(
            metrics.d7ReturnRate.percentage,
            metrics.d7ReturnRate.status
          )}
        />
        <DashboardMetric
          detail={`${activeWindow.from}–${activeWindow.to}`}
          icon={<FlameIcon aria-hidden="true" size={20} />}
          label="최근 7일 활성"
          value={formatCount(metrics.activeUsersLast7Days)}
        />
        <DashboardMetric
          detail={`${formatCount(metrics.writingSelfCheckStartRate.numerator)} / ${formatCount(metrics.writingSelfCheckStartRate.denominator)}개 글`}
          icon={<FileTextIcon aria-hidden="true" size={20} />}
          label="자기 점검 시작률"
          value={formatRate(
            metrics.writingSelfCheckStartRate.percentage,
            metrics.writingSelfCheckStartRate.status
          )}
        />
        <DashboardMetric
          detail={`${formatCount(metrics.writingRevisionAfterSelfCheckRate.numerator)} / ${formatCount(metrics.writingRevisionAfterSelfCheckRate.denominator)}개 점검 시작 글`}
          icon={<CheckCircleIcon aria-hidden="true" size={20} />}
          label="점검 뒤 수정률"
          value={formatRate(
            metrics.writingRevisionAfterSelfCheckRate.percentage,
            metrics.writingRevisionAfterSelfCheckRate.status
          )}
        />
      </section>
    </>
  )
}

function DashboardHeading({ asOfDate }: { readonly asOfDate?: string }) {
  return (
    <AdminPageHeader
      description={
        asOfDate === undefined
          ? "첫 시작과 7일 재방문을 포함한 핵심 운영 지표입니다."
          : `${asOfDate} 기준 · 첫 시작과 7일 재방문을 포함한 핵심 운영 지표입니다.`
      }
    />
  )
}

function DashboardMetric({
  detail,
  icon,
  label,
  value,
}: {
  readonly detail: string
  readonly icon: ReactNode
  readonly label: string
  readonly value: string
}) {
  return (
    <Card aria-label={label} role="article" size="sm" variant="muted">
      <CardContent className="flex flex-col gap-1">
        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
          <span aria-hidden="true" className="shrink-0">
            {icon}
          </span>
          <span className="text-xs font-medium">{label}</span>
        </div>
        <strong className="font-heading text-2xl font-semibold tracking-[-0.03em] tabular-nums">
          {value}
        </strong>
        <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
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
import type { ReactNode } from "react"
