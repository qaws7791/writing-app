"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { cn } from "@/registry/luma/lib/utils";
import { AdminShell } from "@/registry/luma/blocks/admin-shell";
import {
  AdminOverview,
  AdminOverviewHeader,
  AdminOverviewItem,
  AdminOverviewItemActions,
  AdminOverviewItemMeta,
  AdminOverviewItemReason,
  AdminOverviewItemTitle,
  AdminOverviewList,
  AdminOverviewMeta,
  AdminOverviewTitle,
  type AdminOverviewSeverity,
} from "@/registry/luma/ui/admin-overview";
import { Button } from "@/registry/luma/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/registry/luma/ui/chart";

type MetricCardData = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

type QueueItem = {
  id: string;
  severity: AdminOverviewSeverity;
  title: string;
  reason: string;
  action: string;
};

const METRICS: MetricCardData[] = [
  {
    id: "active-learners",
    label: "활성 학습자",
    value: "12,480",
    hint: "전주 대비 +4.2%",
  },
  {
    id: "sessions-today",
    label: "오늘 학습 세션",
    value: "3,216",
    hint: "전일 대비 −1.1%",
  },
  {
    id: "publish-pending",
    label: "게시 대기 코스",
    value: "5",
    hint: "검토 필요 2건 포함",
  },
  {
    id: "interventions",
    label: "개입 필요",
    value: "18",
    hint: "7일 미접속 포함",
  },
];

const QUEUE_ITEMS: QueueItem[] = [
  {
    id: "publish-reading",
    severity: "urgent",
    title: "「중급 읽기」 코스 게시 승인 대기",
    reason: "내일 공개 일정이 잡혀 있습니다.",
    action: "검토",
  },
  {
    id: "interventions",
    severity: "urgent",
    title: "학습자 개입 필요 7건",
    reason: "7일 이상 미접속·반복 오답이 겹칩니다.",
    action: "열기",
  },
  {
    id: "dropout-honorifics",
    severity: "warning",
    title: "레슨 「존댓말 연습」 이탈률 상승",
    reason: "최근 7일 완료율이 38% 하락했습니다.",
    action: "분석",
  },
  {
    id: "item-review",
    severity: "warning",
    title: "문항 검수 대기 12건",
    reason: "새 어휘 유닛 초안이 검증을 통과하지 못했습니다.",
    action: "검수",
  },
  {
    id: "writing-preview",
    severity: "info",
    title: "「쓰기 기초」 draft → preview 이동 가능",
    reason: "검토 코멘트가 모두 해소되었습니다.",
    action: "게시 흐름",
  },
  {
    id: "audit-permissions",
    severity: "info",
    title: "감사 로그: 권한 변경 3건",
    reason: "오늘 오전 운영자 계정 설정이 변경되었습니다.",
    action: "보기",
  },
];

const chartConfig = {
  completions: {
    label: "레슨 완료",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const LESSON_COMPLETIONS = [
  { day: "7/6", completions: 842 },
  { day: "7/7", completions: 918 },
  { day: "7/8", completions: 876 },
  { day: "7/9", completions: 1004 },
  { day: "7/10", completions: 1128 },
  { day: "7/11", completions: 968 },
  { day: "7/12", completions: 734 },
  { day: "7/13", completions: 892 },
  { day: "7/14", completions: 954 },
  { day: "7/15", completions: 1012 },
  { day: "7/16", completions: 1086 },
  { day: "7/17", completions: 1194 },
  { day: "7/18", completions: 1048 },
  { day: "7/19", completions: 812 },
  { day: "7/20", completions: 936 },
  { day: "7/21", completions: 988 },
  { day: "7/22", completions: 1056 },
  { day: "7/23", completions: 1132 },
  { day: "7/24", completions: 1218 },
  { day: "7/25", completions: 1094 },
  { day: "7/26", completions: 846 },
  { day: "7/27", completions: 972 },
  { day: "7/28", completions: 1038 },
  { day: "7/29", completions: 1116 },
  { day: "7/30", completions: 1182 },
  { day: "7/31", completions: 1264 },
  { day: "8/1", completions: 1148 },
  { day: "8/2", completions: 902 },
  { day: "8/3", completions: 1068 },
  { day: "8/4", completions: 1196 },
] as const;

function MetricCard({ metric }: { metric: MetricCardData }) {
  return (
    <div
      data-slot="home-admin-metric"
      className="flex min-w-0 flex-col gap-1 rounded-3xl bg-muted/60 px-4 py-3.5"
    >
      <p className="text-[11px] font-medium text-muted-foreground">{metric.label}</p>
      <p className="font-heading text-xl font-semibold tracking-[-0.03em] tabular-nums sm:text-2xl">
        {metric.value}
      </p>
      <p className="text-[11px] leading-4 text-muted-foreground">{metric.hint}</p>
    </div>
  );
}

function LessonCompletionsChart() {
  return (
    <section
      data-slot="home-admin-chart"
      className="flex flex-col gap-4 rounded-[1.75rem] bg-muted/55 p-4 sm:p-5"
      aria-labelledby="home-admin-chart-title"
    >
      <header className="flex items-baseline justify-between gap-3 px-0.5">
        <div>
          <h2 id="home-admin-chart-title" className="text-sm font-medium tracking-[-0.01em]">
            일별 레슨 완료
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">최근 30일</p>
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">총 30,624</p>
      </header>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-56 w-full sm:h-64"
        initialDimension={{ width: 640, height: 224 }}
      >
        <AreaChart data={[...LESSON_COMPLETIONS]} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="home-admin-completions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-completions)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-completions)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={28} tickMargin={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            tickMargin={4}
            domain={["dataMin - 80", "dataMax + 40"]}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent labelFormatter={(value) => `${value}`} indicator="line" />
            }
          />
          <Area
            type="monotone"
            dataKey="completions"
            stroke="var(--color-completions)"
            fill="url(#home-admin-completions)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ChartContainer>
    </section>
  );
}

function ActionQueue() {
  return (
    <AdminOverview data-slot="home-admin-queue">
      <AdminOverviewHeader>
        <AdminOverviewTitle>오늘 처리할 항목</AdminOverviewTitle>
        <AdminOverviewMeta>{QUEUE_ITEMS.length}건</AdminOverviewMeta>
      </AdminOverviewHeader>
      <AdminOverviewList>
        {QUEUE_ITEMS.map((item) => (
          <AdminOverviewItem key={item.id} severity={item.severity}>
            <AdminOverviewItemTitle>{item.title}</AdminOverviewItemTitle>
            <AdminOverviewItemReason>{item.reason}</AdminOverviewItemReason>
            <AdminOverviewItemMeta severity={item.severity} />
            <AdminOverviewItemActions>
              <Button size="sm" variant="outline" type="button">
                {item.action}
              </Button>
            </AdminOverviewItemActions>
          </AdminOverviewItem>
        ))}
      </AdminOverviewList>
    </AdminOverview>
  );
}

/**
 * Unified operator home for a Korean learning service: metrics, lesson-completion chart, and action queue.
 */
export function HomeAdmin({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <AdminShell
      data-slot="home-admin"
      activeNav="home"
      title="홈"
      className={cn(className)}
      {...props}
    >
      <section
        data-slot="home-admin-metrics"
        className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-3"
        aria-label="주요 지표"
      >
        {METRICS.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <LessonCompletionsChart />
      <ActionQueue />
    </AdminShell>
  );
}

export default HomeAdmin;
