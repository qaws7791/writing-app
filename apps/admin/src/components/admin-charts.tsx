"use client"

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

type DailySeriesPoint = {
  readonly completions: number
  readonly date: string
  readonly signups: number
}

type StreakBucket = {
  readonly count: number
  readonly label: string
}

const tooltipStyle = {
  background: "var(--color-charcoal)",
  border: "none",
  borderRadius: 16,
  color: "var(--color-surface)",
  fontSize: 13,
  fontWeight: 700,
}

export function AdminSignupTrendChart({
  data,
}: {
  readonly data: readonly DailySeriesPoint[]
}) {
  return (
    <ChartCard title="최근 30일 가입 추이">
      <ResponsiveContainer height={260} width="100%">
        <LineChart
          data={[...data]}
          margin={{ bottom: 0, left: -20, right: 8, top: 8 }}
        >
          <CartesianGrid stroke="var(--color-surface)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            interval={5}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            dataKey="signups"
            dot={false}
            name="가입"
            stroke="var(--color-charcoal)"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function AdminCompletionTrendChart({
  data,
}: {
  readonly data: readonly DailySeriesPoint[]
}) {
  return (
    <ChartCard title="일별 레슨 완료">
      <ResponsiveContainer height={260} width="100%">
        <BarChart
          data={[...data]}
          margin={{ bottom: 0, left: -20, right: 8, top: 8 }}
        >
          <CartesianGrid
            stroke="var(--color-surface)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            interval={5}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "transparent" }}
          />
          <Bar
            dataKey="completions"
            fill="var(--color-accent)"
            name="완료"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function AdminStreakDistributionChart({
  data,
}: {
  readonly data: readonly StreakBucket[]
}) {
  return (
    <ChartCard title="스트릭 유지 분포">
      <ResponsiveContainer height={260} width="100%">
        <BarChart
          data={[...data]}
          margin={{ bottom: 0, left: -20, right: 8, top: 8 }}
        >
          <CartesianGrid
            stroke="var(--color-surface)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "transparent" }}
          />
          <Bar
            dataKey="count"
            fill="var(--color-mint)"
            name="사용자 수"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ChartCard({
  children,
  title,
}: {
  readonly children: React.ReactNode
  readonly title: string
}) {
  return (
    <article className="rounded-4xl border border-surface-hover p-6">
      <h2 className="mb-5 text-[1.125rem] font-bold text-foreground">
        {title}
      </h2>
      {children}
    </article>
  )
}
