"use client"

import dynamic from "next/dynamic"
import { Component, useEffect, useRef, useState, type ReactNode } from "react"

type DailySeriesPoint = {
  readonly completions: number
  readonly date: string
  readonly signups: number
}

type StreakBucket = {
  readonly count: number
  readonly label: string
}

type AdminChartPanelProps =
  | {
      readonly data: readonly DailySeriesPoint[]
      readonly kind: "completions" | "signups"
    }
  | {
      readonly data: readonly StreakBucket[]
      readonly kind: "streaks"
    }

const SignupTrendChart = dynamic(
  () =>
    import("@/components/admin-charts").then(
      (module) => module.AdminSignupTrendChart
    ),
  { loading: ChartLoading, ssr: false }
)
const CompletionTrendChart = dynamic(
  () =>
    import("@/components/admin-charts").then(
      (module) => module.AdminCompletionTrendChart
    ),
  { loading: ChartLoading, ssr: false }
)
const StreakDistributionChart = dynamic(
  () =>
    import("@/components/admin-charts").then(
      (module) => module.AdminStreakDistributionChart
    ),
  { loading: ChartLoading, ssr: false }
)

export function AdminChartPanel(props: AdminChartPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoadChart, setShouldLoadChart] = useState(false)
  const title = readChartTitle(props.kind)

  useEffect(() => {
    const container = containerRef.current
    if (container === null || shouldLoadChart) return
    if (typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setShouldLoadChart(true)
        observer.disconnect()
      },
      { rootMargin: "200px" }
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [shouldLoadChart])

  return (
    <article className="rounded-4xl border border-surface-hover p-6">
      <h2 className="mb-2 text-[1.125rem] font-bold text-foreground">
        {title}
      </h2>
      <ChartSummary props={props} />
      <ChartDataTable props={props} title={title} />
      <div aria-hidden="true" className="mt-5 min-h-[260px]" ref={containerRef}>
        {shouldLoadChart ? (
          <ChartErrorBoundary>
            <ChartVisual props={props} />
          </ChartErrorBoundary>
        ) : (
          <ChartLoading />
        )}
      </div>
    </article>
  )
}

function ChartVisual({ props }: { readonly props: AdminChartPanelProps }) {
  if (props.kind === "streaks") {
    return <StreakDistributionChart data={props.data} />
  }
  if (props.kind === "signups") {
    return <SignupTrendChart data={props.data} />
  }
  return <CompletionTrendChart data={props.data} />
}

function ChartSummary({ props }: { readonly props: AdminChartPanelProps }) {
  if (props.kind === "streaks") {
    const total = props.data.reduce((sum, bucket) => sum + bucket.count, 0)
    return (
      <p className="text-[0.875rem] font-medium text-muted-foreground">
        분포에 포함된 사용자 {total.toLocaleString("ko-KR")}명
      </p>
    )
  }

  const valueKey = props.kind === "signups" ? "signups" : "completions"
  const total = props.data.reduce((sum, point) => sum + point[valueKey], 0)
  const label = props.kind === "signups" ? "가입" : "레슨 완료"
  return (
    <p className="text-[0.875rem] font-medium text-muted-foreground">
      기간 합계 {label} {total.toLocaleString("ko-KR")}건
    </p>
  )
}

function ChartDataTable({
  props,
  title,
}: {
  readonly props: AdminChartPanelProps
  readonly title: string
}) {
  if (props.kind === "streaks") {
    return (
      <table className="sr-only">
        <caption>{title} 데이터</caption>
        <thead>
          <tr>
            <th scope="col">연속 학습일</th>
            <th scope="col">사용자 수</th>
          </tr>
        </thead>
        <tbody>
          {props.data.map((bucket) => (
            <tr key={bucket.label}>
              <th scope="row">{bucket.label}</th>
              <td>{bucket.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const valueKey = props.kind === "signups" ? "signups" : "completions"
  const valueLabel = props.kind === "signups" ? "가입 수" : "완료 수"
  return (
    <table className="sr-only">
      <caption>{title} 데이터</caption>
      <thead>
        <tr>
          <th scope="col">날짜</th>
          <th scope="col">{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {props.data.map((point) => (
          <tr key={point.date}>
            <th scope="row">{point.date}</th>
            <td>{point[valueKey]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function readChartTitle(kind: AdminChartPanelProps["kind"]) {
  if (kind === "signups") return "최근 30일 가입 추이"
  if (kind === "completions") return "일별 레슨 완료"
  return "스트릭 유지 분포"
}

function ChartLoading() {
  return (
    <div
      className="h-[260px] animate-pulse rounded-3xl bg-surface"
      role="presentation"
    />
  )
}

class ChartErrorBoundary extends Component<
  { readonly children: ReactNode },
  { readonly failed: boolean }
> {
  override state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  override render() {
    return this.state.failed ? (
      <p className="flex h-[260px] items-center justify-center text-sm font-medium text-muted-foreground">
        차트를 표시하지 못했습니다. 위 요약과 표에서 같은 값을 확인할 수
        있습니다.
      </p>
    ) : (
      this.props.children
    )
  }
}
