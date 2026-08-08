"use client"

import type { CSSProperties } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { AdminChartPanelProps } from "@/entities/admin-analytics/model/admin-chart-types"

const chartMargin = { bottom: 0, left: -20, right: 8, top: 8 }
const axisTick = { fill: "var(--chart-5)", fontSize: 11 }
const tooltipContentStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  color: "var(--foreground)",
  fontSize: 13,
  fontWeight: 700,
} satisfies CSSProperties
const tooltipItemStyle = {
  color: "var(--foreground)",
} satisfies CSSProperties
const tooltipLabelStyle = {
  color: "var(--muted-foreground)",
} satisfies CSSProperties

export function AdminAnalyticsChart({ data, kind }: AdminChartPanelProps) {
  if (kind === "signup-activation") {
    return <SignupActivationChart data={data} />
  }
  if (kind === "start-completion") {
    return <StartCompletionChart data={data} />
  }
  return <D7ReturnChart data={data} />
}

function SignupActivationChart({ data }: Pick<AdminChartPanelProps, "data">) {
  return (
    <ResponsiveContainer height={260} width="100%">
      <LineChart data={[...data]} margin={chartMargin}>
        <CommonChartElements />
        <Line
          dataKey="signups"
          dot={false}
          name="가입"
          stroke="var(--chart-4)"
          strokeWidth={3}
          type="monotone"
        />
        <Line
          dataKey="starts"
          dot={false}
          name="첫 시작"
          stroke="var(--chart-2)"
          strokeWidth={3}
          type="monotone"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function StartCompletionChart({ data }: Pick<AdminChartPanelProps, "data">) {
  return (
    <ResponsiveContainer height={260} width="100%">
      <BarChart data={[...data]} margin={chartMargin}>
        <CommonChartElements barCursor />
        <Bar
          dataKey="starts"
          fill="var(--chart-2)"
          name="첫 시작"
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey="completions"
          fill="var(--chart-1)"
          name="완료"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

function D7ReturnChart({ data }: Pick<AdminChartPanelProps, "data">) {
  return (
    <ResponsiveContainer height={260} width="100%">
      <LineChart data={[...data]} margin={chartMargin}>
        <CommonChartElements />
        <Line
          connectNulls={false}
          dataKey="returns"
          dot={false}
          name="D7 재방문"
          stroke="var(--chart-3)"
          strokeWidth={3}
          type="monotone"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function CommonChartElements({
  barCursor = false,
}: {
  readonly barCursor?: boolean
}) {
  return (
    <>
      <CartesianGrid
        stroke="var(--border)"
        strokeDasharray="3 3"
        vertical={false}
      />
      <XAxis dataKey="date" minTickGap={24} tick={axisTick} />
      <YAxis allowDecimals={false} tick={axisTick} />
      <Tooltip
        contentStyle={tooltipContentStyle}
        itemStyle={tooltipItemStyle}
        labelStyle={tooltipLabelStyle}
        {...(barCursor ? { cursor: { fill: "transparent" } } : {})}
      />
    </>
  )
}
