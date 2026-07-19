"use client"

import dynamic from "next/dynamic"
import { Component, useEffect, useRef, useState, type ReactNode } from "react"

import type { AdminChartPanelProps } from "@/entities/admin-analytics/model/admin-chart-types"

const SignupTrendChart = dynamic(
  () =>
    import("@/entities/admin-analytics/ui/admin-charts").then(
      (module) => module.AdminSignupTrendChart
    ),
  { loading: ChartLoading, ssr: false }
)
const CompletionTrendChart = dynamic(
  () =>
    import("@/entities/admin-analytics/ui/admin-charts").then(
      (module) => module.AdminCompletionTrendChart
    ),
  { loading: ChartLoading, ssr: false }
)
const StreakDistributionChart = dynamic(
  () =>
    import("@/entities/admin-analytics/ui/admin-charts").then(
      (module) => module.AdminStreakDistributionChart
    ),
  { loading: ChartLoading, ssr: false }
)

export function AdminChartVisual(props: AdminChartPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoadChart, setShouldLoadChart] = useState(false)

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
    <div aria-hidden="true" className="mt-5 min-h-[260px]" ref={containerRef}>
      {shouldLoadChart ? (
        <ChartErrorBoundary>
          <ChartVisual props={props} />
        </ChartErrorBoundary>
      ) : (
        <ChartLoading />
      )}
    </div>
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
