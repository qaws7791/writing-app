"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { cn } from "#ui/lib/utils"
import { AdminShell } from "#ui/blocks/admin-shell"
import { Button } from "#ui/components/ui/button"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "#ui/components/ui/chart"
import {
  InterventionItem,
  InterventionItemActions,
  InterventionItemEvidence,
  InterventionItemName,
  InterventionItemReason,
  InterventionQueue,
  InterventionQueueHeader,
  InterventionQueueList,
  InterventionQueueMeta,
  InterventionQueueTitle,
  type InterventionReason,
} from "#ui/components/ui/intervention-queue"
import {
  ItemAnalysis,
  ItemAnalysisDistractor,
  ItemAnalysisDistractors,
  ItemAnalysisFlag,
  ItemAnalysisFlags,
  ItemAnalysisHeader,
  ItemAnalysisList,
  ItemAnalysisMeta,
  ItemAnalysisPrompt,
  ItemAnalysisRow,
  ItemAnalysisStat,
  ItemAnalysisStatLabel,
  ItemAnalysisStatValue,
  ItemAnalysisStats,
  ItemAnalysisTitle,
} from "#ui/components/ui/item-analysis"
import {
  LearningAnalytics,
  LearningAnalyticsGrid,
  LearningAnalyticsHeader,
  LearningAnalyticsMeta,
  LearningAnalyticsMetric,
  LearningAnalyticsMetricHint,
  LearningAnalyticsMetricLabel,
  LearningAnalyticsMetricValue,
  LearningAnalyticsRow,
  LearningAnalyticsSeries,
  LearningAnalyticsTitle,
} from "#ui/components/ui/learning-analytics"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#ui/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#ui/components/ui/tabs"
import {
  WritingAnalytics,
  WritingAnalyticsCriteria,
  WritingAnalyticsCriterion,
  WritingAnalyticsGenre,
  WritingAnalyticsGrid,
  WritingAnalyticsHeader,
  WritingAnalyticsHint,
  WritingAnalyticsMeta,
  WritingAnalyticsMetric,
  WritingAnalyticsMetricLabel,
  WritingAnalyticsMetricValue,
  WritingAnalyticsTitle,
} from "#ui/components/ui/writing-analytics"

type PeriodId = "7d" | "30d" | "90d"
type CohortId = "all" | "reading" | "writing"

const PERIOD_ITEMS = [
  { label: "최근 7일", value: "7d" },
  { label: "최근 30일", value: "30d" },
  { label: "최근 90일", value: "90d" },
] as const

const COHORT_ITEMS = [
  { label: "전체 코호트", value: "all" },
  { label: "중급 읽기", value: "reading" },
  { label: "쓰기 기초", value: "writing" },
] as const

const PERIOD_LABELS: Record<PeriodId, string> = {
  "7d": "최근 7일",
  "30d": "최근 30일",
  "90d": "최근 90일",
}

const COHORT_LABELS: Record<CohortId, string> = {
  all: "전체 코호트",
  reading: "중급 읽기",
  writing: "쓰기 기초",
}

type MetricFixture = {
  id: string
  label: string
  value: string
  hint: string
}

const METRICS_BY_PERIOD: Record<PeriodId, MetricFixture[]> = {
  "7d": [
    {
      id: "completion",
      label: "완료율",
      value: "68%",
      hint: "전 기간 대비 +4%p",
    },
    {
      id: "session",
      label: "중앙 세션 시간",
      value: "14분",
      hint: "전 기간 대비 −1분",
    },
    {
      id: "return",
      label: "복습 복귀율",
      value: "41%",
      hint: "전 기간 대비 +2%p",
    },
    {
      id: "dropout",
      label: "이탈 레슨",
      value: "6",
      hint: "전 기간 대비 −2건",
    },
  ],
  "30d": [
    {
      id: "completion",
      label: "완료율",
      value: "72%",
      hint: "전 기간 대비 +3%p",
    },
    {
      id: "session",
      label: "중앙 세션 시간",
      value: "16분",
      hint: "전 기간 대비 +1분",
    },
    {
      id: "return",
      label: "복습 복귀율",
      value: "38%",
      hint: "전 기간 대비 −1%p",
    },
    {
      id: "dropout",
      label: "이탈 레슨",
      value: "9",
      hint: "전 기간 대비 +1건",
    },
  ],
  "90d": [
    {
      id: "completion",
      label: "완료율",
      value: "74%",
      hint: "전 기간 대비 +5%p",
    },
    {
      id: "session",
      label: "중앙 세션 시간",
      value: "15분",
      hint: "전 기간 대비 동일",
    },
    {
      id: "return",
      label: "복습 복귀율",
      value: "36%",
      hint: "전 기간 대비 −3%p",
    },
    {
      id: "dropout",
      label: "이탈 레슨",
      value: "14",
      hint: "전 기간 대비 +3건",
    },
  ],
}

const CHART_SUMMARY_BY_PERIOD: Record<PeriodId, string> = {
  "7d": "레슨 완료가 전 기간 대비 8% 올랐고, 주말 세션이 평일 대비 22% 낮습니다.",
  "30d":
    "월중 완료가 안정적이며, 주말마다 세션이 평일 대비 약 20% 낮게 유지됩니다.",
  "90d": "분기 초반 이탈이 줄었고, 완료는 완만히 상승하는 추세입니다.",
}

const chartConfig = {
  completions: {
    label: "레슨 완료",
    color: "var(--primary)",
  },
  sessions: {
    label: "활성 세션",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const TREND_DATA = [
  { day: "7/6", completions: 842, sessions: 2180 },
  { day: "7/7", completions: 918, sessions: 2310 },
  { day: "7/8", completions: 876, sessions: 2240 },
  { day: "7/9", completions: 1004, sessions: 2480 },
  { day: "7/10", completions: 1128, sessions: 2610 },
  { day: "7/11", completions: 968, sessions: 1980 },
  { day: "7/12", completions: 734, sessions: 1520 },
  { day: "7/13", completions: 892, sessions: 2260 },
  { day: "7/14", completions: 954, sessions: 2390 },
  { day: "7/15", completions: 1012, sessions: 2510 },
  { day: "7/16", completions: 1086, sessions: 2640 },
  { day: "7/17", completions: 1194, sessions: 2780 },
  { day: "7/18", completions: 1048, sessions: 2090 },
  { day: "7/19", completions: 812, sessions: 1640 },
  { day: "7/20", completions: 936, sessions: 2330 },
  { day: "7/21", completions: 988, sessions: 2440 },
  { day: "7/22", completions: 1056, sessions: 2550 },
  { day: "7/23", completions: 1132, sessions: 2690 },
  { day: "7/24", completions: 1218, sessions: 2810 },
  { day: "7/25", completions: 1094, sessions: 2140 },
  { day: "7/26", completions: 846, sessions: 1710 },
  { day: "7/27", completions: 972, sessions: 2410 },
  { day: "7/28", completions: 1038, sessions: 2520 },
  { day: "7/29", completions: 1116, sessions: 2660 },
  { day: "7/30", completions: 1182, sessions: 2740 },
  { day: "7/31", completions: 1264, sessions: 2890 },
  { day: "8/1", completions: 1148, sessions: 2210 },
  { day: "8/2", completions: 902, sessions: 1780 },
  { day: "8/3", completions: 1068, sessions: 2580 },
  { day: "8/4", completions: 1196, sessions: 2720 },
] as const

type SeriesRow = {
  id: string
  title: string
  completion: string
  dropout: string
}

const SERIES_ROWS: SeriesRow[] = [
  {
    id: "honorifics",
    title: "유닛 · 존댓말 연습",
    completion: "54%",
    dropout: "이탈 18%",
  },
  {
    id: "reading-inference",
    title: "유닛 · 추론 읽기",
    completion: "71%",
    dropout: "이탈 9%",
  },
  {
    id: "vocab-nuance",
    title: "유닛 · 어휘 뉘앙스",
    completion: "63%",
    dropout: "이탈 12%",
  },
  {
    id: "self-intro",
    title: "코스 · 인사와 자기소개",
    completion: "88%",
    dropout: "이탈 3%",
  },
  {
    id: "opinion",
    title: "코스 · 의견 말하기",
    completion: "76%",
    dropout: "이탈 7%",
  },
]

type QueueFixture = {
  id: string
  name: string
  reason: InterventionReason
  evidence: string
  action: string
}

const QUEUE_ITEMS: QueueFixture[] = [
  {
    id: "jiwoo",
    name: "최지우",
    reason: "repeated-errors",
    evidence: "존댓말 연습 · 같은 문항 3회 오답",
    action: "코칭",
  },
  {
    id: "doyoon",
    name: "한도윤",
    reason: "inactive",
    evidence: "중급 읽기 · 9일 미접속",
    action: "기록 보기",
  },
  {
    id: "seoyeon",
    name: "박서연",
    reason: "late-submission",
    evidence: "쓰기 기초 · 과제 2건 지연",
    action: "코칭",
  },
  {
    id: "minho",
    name: "정민호",
    reason: "repeated-errors",
    evidence: "추론 읽기 · 힌트 사용 비율 61%",
    action: "기록 보기",
  },
]

function TrendChart({ period }: { period: PeriodId }) {
  const data = [...(period === "7d" ? TREND_DATA.slice(-7) : TREND_DATA)]
  const totalCompletions = data.reduce((sum, row) => sum + row.completions, 0)

  return (
    <section
      data-slot="admin-analytics-chart"
      className="flex flex-col gap-4 rounded-[1.75rem] bg-muted/55 p-4 sm:p-5"
      aria-labelledby="admin-analytics-chart-title"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-3 px-0.5">
        <div>
          <h2
            id="admin-analytics-chart-title"
            className="text-sm font-medium tracking-[-0.01em]"
          >
            완료·세션 추이
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {PERIOD_LABELS[period]}
          </p>
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">
          레슨 완료 합계{" "}
          {new Intl.NumberFormat("ko-KR").format(totalCompletions)}
        </p>
      </header>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-56 w-full sm:h-64"
        initialDimension={{ width: 640, height: 224 }}
      >
        <AreaChart
          data={[...data]}
          margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id="admin-analytics-completions"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--color-completions)"
                stopOpacity={0.28}
              />
              <stop
                offset="100%"
                stopColor="var(--color-completions)"
                stopOpacity={0.02}
              />
            </linearGradient>
            <linearGradient
              id="admin-analytics-sessions"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--color-sessions)"
                stopOpacity={0.18}
              />
              <stop
                offset="100%"
                stopColor="var(--color-sessions)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            minTickGap={28}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            tickMargin={4}
            domain={["dataMin - 80", "dataMax + 40"]}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) => `${value}`}
                indicator="line"
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            type="monotone"
            dataKey="sessions"
            stroke="var(--color-sessions)"
            fill="url(#admin-analytics-sessions)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Area
            type="monotone"
            dataKey="completions"
            stroke="var(--color-completions)"
            fill="url(#admin-analytics-completions)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ChartContainer>

      <p className="px-0.5 text-xs leading-5 text-pretty text-muted-foreground">
        {CHART_SUMMARY_BY_PERIOD[period]}
      </p>
    </section>
  )
}

function AnalyticsInterventionQueue() {
  return (
    <InterventionQueue
      data-slot="admin-analytics-queue"
      className="min-h-0 rounded-[1.75rem] border border-border/70 bg-card p-4 sm:p-5"
    >
      <InterventionQueueHeader>
        <InterventionQueueTitle>분석 기반 개입</InterventionQueueTitle>
        <InterventionQueueMeta>{QUEUE_ITEMS.length}명</InterventionQueueMeta>
      </InterventionQueueHeader>
      <InterventionQueueList className="max-h-[22rem] overflow-auto pe-0.5">
        {QUEUE_ITEMS.map((item) => (
          <InterventionItem key={item.id} reason={item.reason}>
            <InterventionItemName>{item.name}</InterventionItemName>
            <InterventionItemReason reason={item.reason} />
            <InterventionItemEvidence>{item.evidence}</InterventionItemEvidence>
            <InterventionItemActions>
              <Button size="sm" variant="outline" type="button">
                {item.action}
              </Button>
            </InterventionItemActions>
          </InterventionItem>
        ))}
      </InterventionQueueList>
    </InterventionQueue>
  )
}

function LearningSeriesPanel() {
  return (
    <LearningAnalytics data-slot="admin-analytics-series">
      <LearningAnalyticsHeader>
        <LearningAnalyticsTitle>코스·유닛 추이</LearningAnalyticsTitle>
        <LearningAnalyticsMeta>완료율 · 이탈</LearningAnalyticsMeta>
      </LearningAnalyticsHeader>
      <LearningAnalyticsSeries>
        {SERIES_ROWS.map((row) => (
          <LearningAnalyticsRow key={row.id}>
            <span className="min-w-0 truncate">{row.title}</span>
            <span className="tabular-nums text-muted-foreground">
              {row.dropout}
            </span>
            <div className="flex items-center gap-2">
              <span className="tabular-nums font-medium">{row.completion}</span>
              <Button size="sm" variant="ghost" type="button">
                문항 보기
              </Button>
            </div>
          </LearningAnalyticsRow>
        ))}
      </LearningAnalyticsSeries>
    </LearningAnalytics>
  )
}

function WritingPanel() {
  return (
    <WritingAnalytics data-slot="admin-analytics-writing">
      <WritingAnalyticsHeader>
        <WritingAnalyticsTitle>쓰기 집계</WritingAnalyticsTitle>
        <WritingAnalyticsMeta>설득문 · 코호트</WritingAnalyticsMeta>
      </WritingAnalyticsHeader>
      <WritingAnalyticsGrid>
        <WritingAnalyticsMetric>
          <WritingAnalyticsMetricLabel>평균 길이</WritingAnalyticsMetricLabel>
          <WritingAnalyticsMetricValue>156자</WritingAnalyticsMetricValue>
        </WritingAnalyticsMetric>
        <WritingAnalyticsMetric>
          <WritingAnalyticsMetricLabel>루브릭 평균</WritingAnalyticsMetricLabel>
          <WritingAnalyticsMetricValue>3.1</WritingAnalyticsMetricValue>
        </WritingAnalyticsMetric>
        <WritingAnalyticsMetric>
          <WritingAnalyticsMetricLabel>제출률</WritingAnalyticsMetricLabel>
          <WritingAnalyticsMetricValue>81%</WritingAnalyticsMetricValue>
        </WritingAnalyticsMetric>
        <WritingAnalyticsMetric>
          <WritingAnalyticsMetricLabel>재작성률</WritingAnalyticsMetricLabel>
          <WritingAnalyticsMetricValue>24%</WritingAnalyticsMetricValue>
        </WritingAnalyticsMetric>
      </WritingAnalyticsGrid>
      <div className="flex flex-wrap gap-1.5">
        <WritingAnalyticsGenre>설득</WritingAnalyticsGenre>
        <WritingAnalyticsGenre>설명</WritingAnalyticsGenre>
        <WritingAnalyticsGenre>편지</WritingAnalyticsGenre>
      </div>
      <WritingAnalyticsCriteria>
        <WritingAnalyticsCriterion>
          <span>주장 명확성</span>
          <span className="tabular-nums text-muted-foreground">3.4</span>
        </WritingAnalyticsCriterion>
        <WritingAnalyticsCriterion>
          <span>근거 적절성</span>
          <span className="tabular-nums text-muted-foreground">2.7</span>
        </WritingAnalyticsCriterion>
        <WritingAnalyticsCriterion>
          <span>문장 응집</span>
          <span className="tabular-nums text-muted-foreground">3.2</span>
        </WritingAnalyticsCriterion>
      </WritingAnalyticsCriteria>
      <WritingAnalyticsHint>
        근거 적절성 점수가 낮습니다. 「근거 고르기」 레슨과 모범 답안을 먼저
        점검하세요.
      </WritingAnalyticsHint>
    </WritingAnalytics>
  )
}

function ItemPanel() {
  return (
    <ItemAnalysis data-slot="admin-analytics-items">
      <ItemAnalysisHeader>
        <ItemAnalysisTitle>문제 문항</ItemAnalysisTitle>
        <ItemAnalysisMeta>플래그 우선 · n=842</ItemAnalysisMeta>
      </ItemAnalysisHeader>
      <ItemAnalysisList>
        <ItemAnalysisRow>
          <ItemAnalysisPrompt>
            다음 대화에서 알맞은 존댓말 표현을 고르세요.
          </ItemAnalysisPrompt>
          <ItemAnalysisStats>
            <ItemAnalysisStat>
              <ItemAnalysisStatLabel>정답률</ItemAnalysisStatLabel>
              <ItemAnalysisStatValue>38%</ItemAnalysisStatValue>
            </ItemAnalysisStat>
            <ItemAnalysisStat>
              <ItemAnalysisStatLabel>평균 시간</ItemAnalysisStatLabel>
              <ItemAnalysisStatValue>52초</ItemAnalysisStatValue>
            </ItemAnalysisStat>
            <ItemAnalysisStat>
              <ItemAnalysisStatLabel>힌트 사용</ItemAnalysisStatLabel>
              <ItemAnalysisStatValue>47%</ItemAnalysisStatValue>
            </ItemAnalysisStat>
          </ItemAnalysisStats>
          <ItemAnalysisDistractors>
            <ItemAnalysisDistractor selected>
              <span>했어</span>
              <span className="tabular-nums text-muted-foreground">41%</span>
            </ItemAnalysisDistractor>
            <ItemAnalysisDistractor>
              <span>했습니다</span>
              <span className="tabular-nums text-muted-foreground">38%</span>
            </ItemAnalysisDistractor>
            <ItemAnalysisDistractor>
              <span>함</span>
              <span className="tabular-nums text-muted-foreground">21%</span>
            </ItemAnalysisDistractor>
          </ItemAnalysisDistractors>
          <ItemAnalysisFlags>
            <ItemAnalysisFlag flag="high-dropout" />
            <ItemAnalysisFlag flag="distractor-bias" />
          </ItemAnalysisFlags>
        </ItemAnalysisRow>

        <ItemAnalysisRow>
          <ItemAnalysisPrompt>
            밑줄 친 부분의 의미를 가장 잘 나타낸 것은?
          </ItemAnalysisPrompt>
          <ItemAnalysisStats>
            <ItemAnalysisStat>
              <ItemAnalysisStatLabel>정답률</ItemAnalysisStatLabel>
              <ItemAnalysisStatValue>44%</ItemAnalysisStatValue>
            </ItemAnalysisStat>
            <ItemAnalysisStat>
              <ItemAnalysisStatLabel>평균 시간</ItemAnalysisStatLabel>
              <ItemAnalysisStatValue>1분 8초</ItemAnalysisStatValue>
            </ItemAnalysisStat>
            <ItemAnalysisStat>
              <ItemAnalysisStatLabel>재시도</ItemAnalysisStatLabel>
              <ItemAnalysisStatValue>2.8회</ItemAnalysisStatValue>
            </ItemAnalysisStat>
          </ItemAnalysisStats>
          <ItemAnalysisFlags>
            <ItemAnalysisFlag flag="hint-heavy" />
            <ItemAnalysisFlag flag="retry-heavy" />
          </ItemAnalysisFlags>
        </ItemAnalysisRow>

        <ItemAnalysisRow>
          <ItemAnalysisPrompt>
            주장에 대한 반박으로 가장 적절한 문장을 고르세요.
          </ItemAnalysisPrompt>
          <ItemAnalysisStats>
            <ItemAnalysisStat>
              <ItemAnalysisStatLabel>정답률</ItemAnalysisStatLabel>
              <ItemAnalysisStatValue>51%</ItemAnalysisStatValue>
            </ItemAnalysisStat>
            <ItemAnalysisStat>
              <ItemAnalysisStatLabel>평균 시간</ItemAnalysisStatLabel>
              <ItemAnalysisStatValue>41초</ItemAnalysisStatValue>
            </ItemAnalysisStat>
          </ItemAnalysisStats>
          <ItemAnalysisFlags>
            <ItemAnalysisFlag flag="distractor-bias" />
          </ItemAnalysisFlags>
        </ItemAnalysisRow>
      </ItemAnalysisList>
    </ItemAnalysis>
  )
}

/**
 * Operator analytics workspace: cohort filters, KPI grid, dual-series trend,
 * intervention queue, and learning/writing/item drill-down tabs.
 */
export function AdminAnalytics({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [period, setPeriod] = React.useState<PeriodId>("30d")
  const [cohort, setCohort] = React.useState<CohortId>("all")
  const metrics = METRICS_BY_PERIOD[period]

  return (
    <AdminShell
      data-slot="admin-analytics"
      activeNav="analytics"
      title="분석"
      description="코호트 학습·쓰기·문항 지표를 살펴봅니다"
      className={cn(className)}
      {...props}
    >
      <div
        data-slot="admin-analytics-filters"
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Select
            items={[...PERIOD_ITEMS]}
            value={period}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value
              if (next === "7d" || next === "30d" || next === "90d") {
                setPeriod(next)
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-full sm:w-36"
              aria-label="기간"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {PERIOD_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={[...COHORT_ITEMS]}
            value={cohort}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value
              if (next === "all" || next === "reading" || next === "writing") {
                setCohort(next)
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-full sm:w-40"
              aria-label="코호트"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {COHORT_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground sm:text-sm">
          {COHORT_LABELS[cohort]} · {PERIOD_LABELS[period]}
        </p>
      </div>

      <LearningAnalytics data-slot="admin-analytics-kpi">
        <LearningAnalyticsHeader>
          <LearningAnalyticsTitle>코호트 지표</LearningAnalyticsTitle>
          <LearningAnalyticsMeta>{PERIOD_LABELS[period]}</LearningAnalyticsMeta>
        </LearningAnalyticsHeader>
        <LearningAnalyticsGrid>
          {metrics.map((metric) => (
            <LearningAnalyticsMetric key={metric.id}>
              <LearningAnalyticsMetricLabel>
                {metric.label}
              </LearningAnalyticsMetricLabel>
              <LearningAnalyticsMetricValue>
                {metric.value}
              </LearningAnalyticsMetricValue>
              <LearningAnalyticsMetricHint>
                {metric.hint}
              </LearningAnalyticsMetricHint>
            </LearningAnalyticsMetric>
          ))}
        </LearningAnalyticsGrid>
      </LearningAnalytics>

      <div
        data-slot="admin-analytics-mid"
        className="grid gap-6 @[52rem]/admin-main:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] @[52rem]/admin-main:items-start"
      >
        <TrendChart period={period} />
        <AnalyticsInterventionQueue />
      </div>

      <Tabs
        defaultValue="learning"
        className="gap-4"
        data-slot="admin-analytics-tabs"
      >
        <TabsList variant="line" className="w-fit justify-start">
          <TabsTrigger value="learning">학습 추이</TabsTrigger>
          <TabsTrigger value="writing">쓰기</TabsTrigger>
          <TabsTrigger value="items">문항</TabsTrigger>
        </TabsList>
        <TabsContent
          value="learning"
          className="rounded-[1.5rem] border border-border/70 bg-card p-4 sm:p-5"
        >
          <LearningSeriesPanel />
        </TabsContent>
        <TabsContent
          value="writing"
          className="rounded-[1.5rem] border border-border/70 bg-card p-4 sm:p-5"
        >
          <WritingPanel />
        </TabsContent>
        <TabsContent
          value="items"
          className="rounded-[1.5rem] border border-border/70 bg-card p-4 sm:p-5"
        >
          <ItemPanel />
        </TabsContent>
      </Tabs>
    </AdminShell>
  )
}

export default AdminAnalytics
