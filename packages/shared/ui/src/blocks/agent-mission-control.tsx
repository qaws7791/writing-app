"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  Clock01Icon,
  CreditCardIcon,
  DatabaseIcon,
  File01Icon,
  Refresh01Icon,
  Search01Icon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "#ui/lib/utils"
import { AdminShell } from "#ui/blocks/admin-shell"
import { Avatar, AvatarFallback } from "#ui/components/ui/avatar"
import { Badge } from "#ui/components/ui/badge"
import { Button } from "#ui/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "#ui/components/ui/chart"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "#ui/components/ui/empty"
import { Input } from "#ui/components/ui/input"
import {
  ProvenanceList,
  ProvenancePanel,
  ProvenancePanelHeader,
  ProvenancePanelTitle,
  ProvenanceRow,
  ProvenanceRowLabel,
  ProvenanceRowMeta,
  ProvenanceRowModel,
  ProvenanceRowStatus,
} from "#ui/components/ui/provenance-panel"
import {
  RUN_QUEUE_STATUS_LABELS,
  RunQueue,
  RunQueueEmpty,
  RunQueueEnvironment,
  RunQueueFooter,
  RunQueueGroup,
  RunQueueGroupCount,
  RunQueueGroupHeader,
  RunQueueGroupHint,
  RunQueueGroupTitle,
  RunQueueGroups,
  RunQueueHeader,
  RunQueueItem,
  RunQueueItemBody,
  RunQueueItemIcon,
  RunQueueItemProgress,
  RunQueueItemStep,
  RunQueueItemTime,
  RunQueueItemTitle,
  RunQueueList,
  RunQueueMeta,
  RunQueueOutcome,
  RunQueueSummary,
  RunQueueSummaryChip,
  RunQueueTitle,
  RunQueueToolbar,
  type RunQueueEnv,
  type RunQueueOutcomeKind,
  type RunQueueStatus,
} from "#ui/components/ui/run-queue"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#ui/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "#ui/components/ui/sheet"
import {
  StepTrace,
  StepTraceBody,
  StepTraceDescription,
  StepTraceDuration,
  StepTraceError,
  StepTraceHeader,
  StepTraceList,
  StepTraceMark,
  StepTraceMeta,
  StepTraceStatusBadge,
  StepTraceStep,
  StepTraceStepHeader,
  StepTraceStepTitle,
  StepTraceTitle,
  StepTraceTool,
  StepTraceToolDuration,
  StepTraceToolName,
  StepTraceToolStatus,
  StepTraceTools,
  type StepTraceStatus,
  type StepTraceToolKind,
} from "#ui/components/ui/step-trace"

type AgentIcon = typeof CreditCardIcon

type ToolCall = {
  name: string
  duration: string
  status: StepTraceToolKind
}

type StepData = {
  id: string
  title: string
  status: StepTraceStatus
  duration?: string
  description?: string
  error?: string
  tools?: ToolCall[]
}

type AgentRun = {
  id: string
  runId: string
  agent: string
  title: string
  stepLabel: string
  status: RunQueueStatus
  outcome: RunQueueOutcomeKind
  environment: RunQueueEnv
  progress: number
  updatedAt: string
  updatedLabel: string
  icon: AgentIcon
  owners: string[]
  priority: string
  retryPolicy: string
  maxRetries: string
  onFailure: string
  startedAt: string
  lastActivity: string
  model: string
  steps: StepData[]
}

type Incident = {
  id: string
  title: string
  severity: "critical" | "major" | "minor"
  agent: string
  time: string
  description: string
  resolved: boolean
}

const STATUS_ORDER: RunQueueStatus[] = [
  "running",
  "waiting",
  "failed",
  "completed",
]

const STATUS_FILTER_ITEMS = [
  { value: "all", label: "모든 상태" },
  { value: "running", label: "실행 중" },
  { value: "waiting", label: "대기" },
  { value: "failed", label: "실패" },
  { value: "completed", label: "완료" },
] as const

type StatusFilter = (typeof STATUS_FILTER_ITEMS)[number]["value"]

const RUNS: AgentRun[] = [
  {
    id: "run-1",
    runId: "RUN-4822",
    agent: "Refund Resolver",
    title: "ORD-99214 중복 결제 환불 처리",
    stepLabel: "3/6 단계 · 부분 캡처 실패",
    status: "failed",
    outcome: "escalated",
    environment: "production",
    progress: 48,
    updatedAt: "2026-08-04T04:20:00",
    updatedLabel: "8분 전",
    icon: CreditCardIcon,
    owners: ["김운영", "이결제"],
    priority: "높음",
    retryPolicy: "지수 백오프",
    maxRetries: "단계당 3회",
    onFailure: "소유자에게 알림",
    startedAt: "2026-08-04 12:38",
    lastActivity: "8분 전",
    model: "hermes-refund-v2",
    steps: [
      {
        id: "s1",
        title: "환불 접근 방식 계획",
        status: "completed",
        duration: "14s",
        tools: [
          { name: "orders.lookup", duration: "420ms", status: "succeeded" },
        ],
      },
      {
        id: "s2",
        title: "원거래와 중복 결제 대조",
        status: "completed",
        duration: "31s",
        tools: [
          { name: "payments.match", duration: "1.2s", status: "succeeded" },
        ],
      },
      {
        id: "s3",
        title: "부분 캡처 환불 요청",
        status: "failed",
        duration: "6s",
        description: "프로세서가 원카드 부분 캡처를 거절했습니다.",
        error:
          "processor_declined: partial capture on original card is not allowed for this merchant.",
        tools: [
          {
            name: "payments.refunds.create",
            duration: "890ms",
            status: "failed",
          },
        ],
      },
      {
        id: "s4",
        title: "대체 환불 경로 제안",
        status: "pending",
      },
      {
        id: "s5",
        title: "고객 알림 초안",
        status: "pending",
      },
      {
        id: "s6",
        title: "감사 기록 작성",
        status: "pending",
      },
    ],
  },
  {
    id: "run-2",
    runId: "RUN-4798",
    agent: "Fraud Screener",
    title: "고위험 결제 세션 실시간 심사",
    stepLabel: "4/6 단계 · 두 번째 거래 대조 중",
    status: "running",
    outcome: "on-track",
    environment: "production",
    progress: 62,
    updatedAt: "2026-08-04T04:26:00",
    updatedLabel: "2분 전",
    icon: Alert02Icon,
    owners: ["박보안"],
    priority: "보통",
    retryPolicy: "즉시 1회",
    maxRetries: "단계당 2회",
    onFailure: "보안 큐로 이동",
    startedAt: "2026-08-04 12:51",
    lastActivity: "2분 전",
    model: "hermes-fraud-v1",
    steps: [
      {
        id: "s1",
        title: "세션 신호 수집",
        status: "completed",
        duration: "9s",
        tools: [
          { name: "risk.signals", duration: "310ms", status: "succeeded" },
        ],
      },
      {
        id: "s2",
        title: "기기 지문 확인",
        status: "completed",
        duration: "12s",
      },
      {
        id: "s3",
        title: "이전 거절 패턴 조회",
        status: "completed",
        duration: "18s",
      },
      {
        id: "s4",
        title: "두 번째 거래 대조",
        status: "running",
        description: "도구 호출이 스트리밍되고 있습니다.",
        tools: [{ name: "payments.compare", duration: "…", status: "running" }],
      },
      { id: "s5", title: "위험 점수 산출", status: "pending" },
      { id: "s6", title: "조치 권고 기록", status: "pending" },
    ],
  },
  {
    id: "run-3",
    runId: "RUN-4810",
    agent: "Nightly Report",
    title: "야간 운영 요약 리포트 생성",
    stepLabel: "2/5 단계 · 메트릭 집계 대기",
    status: "waiting",
    outcome: "needs-approval",
    environment: "staging",
    progress: 34,
    updatedAt: "2026-08-04T03:55:00",
    updatedLabel: "33분 전",
    icon: File01Icon,
    owners: ["최스케줄"],
    priority: "낮음",
    retryPolicy: "스케줄 재시도",
    maxRetries: "일 1회",
    onFailure: "다음날로 이월",
    startedAt: "2026-08-04 03:00",
    lastActivity: "33분 전",
    model: "hermes-report-v3",
    steps: [
      {
        id: "s1",
        title: "소스 채널 수집",
        status: "completed",
        duration: "22s",
        tools: [
          { name: "cron.fetch", duration: "1.1s", status: "succeeded" },
          { name: "discord.digest", duration: "640ms", status: "succeeded" },
        ],
      },
      {
        id: "s2",
        title: "메트릭 집계 승인 대기",
        status: "pending",
        description: "Staging 게시 전 운영자 승인이 필요합니다.",
      },
      { id: "s3", title: "요약 문장 생성", status: "pending" },
      { id: "s4", title: "차트 스냅샷 첨부", status: "pending" },
      { id: "s5", title: "수신자 배포", status: "pending" },
    ],
  },
  {
    id: "run-4",
    runId: "RUN-4788",
    agent: "Data Steward",
    title: "학습자 이벤트 웨어하우스 동기화",
    stepLabel: "5/5 단계 · 검증 통과",
    status: "completed",
    outcome: "done",
    environment: "production",
    progress: 100,
    updatedAt: "2026-08-04T02:10:00",
    updatedLabel: "2시간 전",
    icon: DatabaseIcon,
    owners: ["정데이터"],
    priority: "보통",
    retryPolicy: "지수 백오프",
    maxRetries: "단계당 5회",
    onFailure: "파이프라인 알림",
    startedAt: "2026-08-04 01:42",
    lastActivity: "2시간 전",
    model: "hermes-data-v1",
    steps: [
      { id: "s1", title: "증분 추출", status: "completed", duration: "1m 12s" },
      { id: "s2", title: "스키마 검증", status: "completed", duration: "18s" },
      { id: "s3", title: "변환 적용", status: "completed", duration: "44s" },
      {
        id: "s4",
        title: "웨어하우스 적재",
        status: "completed",
        duration: "2m 03s",
      },
      { id: "s5", title: "행 수 검증", status: "completed", duration: "9s" },
    ],
  },
  {
    id: "run-5",
    runId: "RUN-4801",
    agent: "CLI Companion",
    title: "게이트웨이 헬스체크 후 설정 스냅샷",
    stepLabel: "1/4 단계 · 속도 제한 대기",
    status: "waiting",
    outcome: "retrying",
    environment: "development",
    progress: 18,
    updatedAt: "2026-08-04T04:18:00",
    updatedLabel: "10분 전",
    icon: SourceCodeIcon,
    owners: ["개발자"],
    priority: "낮음",
    retryPolicy: "고정 간격",
    maxRetries: "단계당 4회",
    onFailure: "로컬 로그만 기록",
    startedAt: "2026-08-04 12:40",
    lastActivity: "10분 전",
    model: "hermes-cli-v0",
    steps: [
      {
        id: "s1",
        title: "게이트웨이 핑",
        status: "running",
        description: "속도 제한이 풀릴 때까지 대기 중입니다.",
        tools: [{ name: "gateway.ping", duration: "…", status: "running" }],
      },
      { id: "s2", title: "활성 세션 수집", status: "pending" },
      { id: "s3", title: "설정 스냅샷", status: "pending" },
      { id: "s4", title: "로컬 아카이브", status: "pending" },
    ],
  },
  {
    id: "run-6",
    runId: "RUN-4772",
    agent: "Refund Resolver",
    title: "ORD-98801 부분 환불 완료 보고",
    stepLabel: "6/6 단계 · 감사 기록 완료",
    status: "completed",
    outcome: "done",
    environment: "production",
    progress: 100,
    updatedAt: "2026-08-03T22:40:00",
    updatedLabel: "어제",
    icon: CreditCardIcon,
    owners: ["김운영"],
    priority: "보통",
    retryPolicy: "지수 백오프",
    maxRetries: "단계당 3회",
    onFailure: "소유자에게 알림",
    startedAt: "2026-08-03 21:58",
    lastActivity: "어제",
    model: "hermes-refund-v2",
    steps: [
      { id: "s1", title: "주문 조회", status: "completed", duration: "8s" },
      {
        id: "s2",
        title: "환불 금액 산정",
        status: "completed",
        duration: "11s",
      },
      { id: "s3", title: "환불 실행", status: "completed", duration: "19s" },
      { id: "s4", title: "고객 알림", status: "completed", duration: "6s" },
      { id: "s5", title: "원장 반영", status: "completed", duration: "14s" },
      { id: "s6", title: "감사 기록", status: "completed", duration: "4s" },
    ],
  },
  {
    id: "run-7",
    runId: "RUN-4815",
    agent: "Fraud Screener",
    title: "반복 기기 ID 차단 후보 검토",
    stepLabel: "3/5 단계 · 도구 호출 스트리밍",
    status: "running",
    outcome: "on-track",
    environment: "staging",
    progress: 55,
    updatedAt: "2026-08-04T04:27:00",
    updatedLabel: "1분 전",
    icon: Alert02Icon,
    owners: ["박보안", "한리뷰"],
    priority: "높음",
    retryPolicy: "즉시 1회",
    maxRetries: "단계당 2회",
    onFailure: "보안 큐로 이동",
    startedAt: "2026-08-04 12:55",
    lastActivity: "1분 전",
    model: "hermes-fraud-v1",
    steps: [
      {
        id: "s1",
        title: "후보 목록 로드",
        status: "completed",
        duration: "7s",
      },
      {
        id: "s2",
        title: "히스토리 조인",
        status: "completed",
        duration: "16s",
      },
      {
        id: "s3",
        title: "차단 규칙 평가",
        status: "running",
        tools: [{ name: "rules.evaluate", duration: "…", status: "running" }],
      },
      { id: "s4", title: "권고안 작성", status: "pending" },
      { id: "s5", title: "Staging 기록", status: "pending" },
    ],
  },
  {
    id: "run-8",
    runId: "RUN-4760",
    agent: "Nightly Report",
    title: "Discord 채널 일일 다이제스트",
    stepLabel: "4/4 단계 · 전송 완료",
    status: "completed",
    outcome: "done",
    environment: "production",
    progress: 100,
    updatedAt: "2026-08-04T00:05:00",
    updatedLabel: "4시간 전",
    icon: File01Icon,
    owners: ["최스케줄"],
    priority: "낮음",
    retryPolicy: "스케줄 재시도",
    maxRetries: "일 1회",
    onFailure: "다음날로 이월",
    startedAt: "2026-08-03 23:50",
    lastActivity: "4시간 전",
    model: "hermes-report-v3",
    steps: [
      { id: "s1", title: "메시지 수집", status: "completed", duration: "28s" },
      {
        id: "s2",
        title: "주제 클러스터링",
        status: "completed",
        duration: "41s",
      },
      { id: "s3", title: "요약 생성", status: "completed", duration: "33s" },
      { id: "s4", title: "채널 전송", status: "completed", duration: "5s" },
    ],
  },
]

const INCIDENTS: Incident[] = [
  {
    id: "inc-1",
    title: "부분 캡처 거절 연쇄",
    severity: "critical",
    agent: "Refund Resolver",
    time: "8분 전",
    description: "Production에서 payments.refunds.create가 연속 실패했습니다.",
    resolved: false,
  },
  {
    id: "inc-2",
    title: "Staging 승인 적체",
    severity: "major",
    agent: "Nightly Report",
    time: "33분 전",
    description: "야간 리포트가 운영자 승인 큐에서 33분째 대기 중입니다.",
    resolved: false,
  },
  {
    id: "inc-3",
    title: "게이트웨이 속도 제한",
    severity: "minor",
    agent: "CLI Companion",
    time: "10분 전",
    description: "Development 핑이 rate limit에 걸려 재시도 중입니다.",
    resolved: false,
  },
  {
    id: "inc-4",
    title: "웨어하우스 동기화 지연",
    severity: "minor",
    agent: "Data Steward",
    time: "2시간 전",
    description: "적재가 지연되었으나 행 수 검증 후 자동 복구되었습니다.",
    resolved: true,
  },
]

const THROUGHPUT = [
  { hour: "04:00", runs: 28 },
  { hour: "06:00", runs: 36 },
  { hour: "08:00", runs: 54 },
  { hour: "10:00", runs: 72 },
  { hour: "12:00", runs: 91 },
  { hour: "14:00", runs: 84 },
  { hour: "16:00", runs: 98 },
  { hour: "18:00", runs: 76 },
  { hour: "20:00", runs: 63 },
] as const

const chartConfig = {
  runs: {
    label: "실행 수",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function selectValue(value: unknown) {
  return typeof value === "string" ? value : undefined
}

function failedStepIndex(run: AgentRun) {
  const index = run.steps.findIndex((step) => step.status === "failed")
  return index >= 0 ? index + 1 : null
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1">
      <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-pretty">{children}</dd>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: Incident["severity"] }) {
  const label =
    severity === "critical"
      ? "Critical"
      : severity === "major"
        ? "Major"
        : "Minor"
  const variant =
    severity === "critical"
      ? "destructive"
      : severity === "major"
        ? "warning"
        : "info"
  return <Badge variant={variant}>{label}</Badge>
}

/**
 * Read-only Hermes agent mission control: live run queue, throughput, incidents, and step traces.
 */
export function AgentMissionControl({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [query, setQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const q = query.trim().toLowerCase()
  const filtered = RUNS.filter((run) => {
    if (statusFilter !== "all" && run.status !== statusFilter) return false
    if (!q) return true
    return (
      run.title.toLowerCase().includes(q) ||
      run.agent.toLowerCase().includes(q) ||
      run.runId.toLowerCase().includes(q)
    )
  })

  const byStatus = Object.fromEntries(
    STATUS_ORDER.map((status) => [status, 0])
  ) as Record<RunQueueStatus, number>
  for (const run of filtered) byStatus[run.status] += 1
  const counts = {
    total: filtered.length,
    escalated: filtered.filter((run) => run.outcome === "escalated").length,
    needsApproval: filtered.filter((run) => run.outcome === "needs-approval")
      .length,
    unassigned: 0,
    byStatus,
  }

  const selected = RUNS.find((run) => run.id === selectedId) ?? null
  const failedAt = selected ? failedStepIndex(selected) : null

  function openRun(run: AgentRun) {
    setSelectedId(run.id)
    setSheetOpen(true)
  }

  return (
    <AdminShell
      data-slot="agent-mission-control"
      activeNav="agents"
      title="미션 컨트롤"
      description="Hermes 에이전트 실행 상태를 확인합니다"
      className={cn(className)}
      {...props}
    >
      <section
        data-slot="agent-mission-control-header"
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg font-semibold tracking-[-0.02em] sm:text-xl">
              Run Queue
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/8 px-2 py-0.5 text-[11px] font-medium text-success">
              <span
                className="size-1.5 animate-pulse rounded-full bg-success"
                aria-hidden
              />
              Live
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            라이브 에이전트 실행 백로그를 읽고 상태를 추적합니다. 최근 24시간.
          </p>
        </div>

        <RunQueueSummary aria-label="실행 요약">
          <RunQueueSummaryChip>
            Runs <span className="text-foreground">{counts.total}</span>
          </RunQueueSummaryChip>
          <RunQueueSummaryChip tone={counts.escalated ? "danger" : "default"}>
            Escalated{" "}
            <span className="text-foreground">{counts.escalated}</span>
          </RunQueueSummaryChip>
          <RunQueueSummaryChip
            tone={counts.needsApproval ? "warning" : "default"}
          >
            Needs approval{" "}
            <span className="text-foreground">{counts.needsApproval}</span>
          </RunQueueSummaryChip>
          <RunQueueSummaryChip>
            Unassigned{" "}
            <span className="text-foreground">{counts.unassigned}</span>
          </RunQueueSummaryChip>
        </RunQueueSummary>
      </section>

      <RunQueue data-slot="agent-mission-control-queue">
        <RunQueueHeader>
          <div>
            <RunQueueTitle>상태별 실행</RunQueueTitle>
            <RunQueueMeta>{counts.total}개 표시 중</RunQueueMeta>
          </div>
        </RunQueueHeader>

        <RunQueueToolbar>
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="에이전트·실행 ID 검색"
              className="h-9 ps-9"
              aria-label="에이전트·실행 검색"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              items={[...STATUS_FILTER_ITEMS]}
              value={statusFilter}
              onValueChange={(value) => {
                const next = selectValue(value) as StatusFilter | undefined
                if (next) setStatusFilter(next)
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-full sm:w-36"
                aria-label="상태 필터"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {STATUS_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
              새로고침
            </Button>
          </div>
        </RunQueueToolbar>

        {filtered.length === 0 ? (
          <RunQueueEmpty>
            <Empty variant="compact">
              <EmptyHeader>
                <EmptyTitle>조건에 맞는 실행이 없습니다</EmptyTitle>
                <EmptyDescription>
                  검색어나 상태 필터를 넓혀 다시 살펴보세요.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </RunQueueEmpty>
        ) : (
          <RunQueueGroups>
            {STATUS_ORDER.map((status) => {
              const items = filtered.filter((run) => run.status === status)
              if (items.length === 0) return null
              return (
                <RunQueueGroup key={status} status={status}>
                  <RunQueueGroupHeader>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <RunQueueGroupTitle status={status}>
                        {RUN_QUEUE_STATUS_LABELS[status]}
                        <RunQueueGroupCount>{items.length}</RunQueueGroupCount>
                      </RunQueueGroupTitle>
                      <RunQueueGroupHint status={status} />
                    </div>
                  </RunQueueGroupHeader>
                  <RunQueueList>
                    {items.map((run) => {
                      const isSelected = selectedId === run.id && sheetOpen
                      return (
                        <RunQueueItem
                          key={run.id}
                          status={run.status}
                          selected={isSelected}
                          className="p-0 hover:bg-transparent data-[selected=true]:bg-transparent"
                        >
                          <button
                            type="button"
                            aria-label={`${run.agent}: ${run.title}`}
                            aria-pressed={isSelected}
                            className={cn(
                              "col-span-full flex w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-3.5 py-3 text-left outline-none",
                              "hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring/40",
                              isSelected && "bg-muted/40"
                            )}
                            onClick={() => openRun(run)}
                          >
                            <RunQueueItemIcon>
                              <HugeiconsIcon icon={run.icon} strokeWidth={2} />
                            </RunQueueItemIcon>
                            <RunQueueItemBody className="min-w-0 flex-1 basis-[12rem]">
                              <RunQueueItemTitle>{run.title}</RunQueueItemTitle>
                              <RunQueueItemStep>
                                {run.agent} · {run.runId} · {run.stepLabel}
                              </RunQueueItemStep>
                            </RunQueueItemBody>
                            <RunQueueEnvironment
                              environment={run.environment}
                            />
                            <RunQueueItemTime
                              dateTime={run.updatedAt}
                              className="inline"
                            >
                              {run.updatedLabel}
                            </RunQueueItemTime>
                            <div className="flex min-w-0 flex-1 basis-[10rem] items-center justify-between gap-3">
                              <RunQueueItemProgress value={run.progress} />
                              <RunQueueOutcome outcome={run.outcome} />
                            </div>
                          </button>
                        </RunQueueItem>
                      )
                    })}
                  </RunQueueList>
                </RunQueueGroup>
              )
            })}
          </RunQueueGroups>
        )}

        <RunQueueFooter>
          <div className="flex flex-wrap items-center gap-3">
            {STATUS_ORDER.map((status) => (
              <span key={status} className="inline-flex items-center gap-1.5">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    status === "running" && "bg-info",
                    status === "waiting" && "bg-muted-foreground/50",
                    status === "failed" && "bg-destructive",
                    status === "completed" && "bg-success"
                  )}
                  aria-hidden
                />
                {RUN_QUEUE_STATUS_LABELS[status]} {counts.byStatus[status]}
              </span>
            ))}
          </div>
          <p className="tabular-nums">
            {counts.total} / {RUNS.length} runs visible
          </p>
        </RunQueueFooter>
      </RunQueue>

      <div
        data-slot="agent-mission-control-secondary"
        className="grid gap-4 @[52rem]/admin-main:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
      >
        <section
          data-slot="agent-mission-control-throughput"
          className="flex flex-col gap-4 rounded-[1.75rem] bg-muted/55 p-4 sm:p-5"
          aria-labelledby="agent-mission-control-throughput-title"
        >
          <header className="flex items-baseline justify-between gap-3 px-0.5">
            <div>
              <h3
                id="agent-mission-control-throughput-title"
                className="text-sm font-medium tracking-[-0.01em]"
              >
                Run Throughput
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                최근 24시간
              </p>
            </div>
            <div className="text-end">
              <p className="text-sm font-medium tabular-nums">1,263</p>
              <p className="text-[11px] text-success">+12.4%</p>
            </div>
          </header>
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-48 w-full sm:h-56"
            initialDimension={{ width: 560, height: 192 }}
          >
            <AreaChart
              data={[...THROUGHPUT]}
              margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="agent-mission-control-runs"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--color-runs)"
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-runs)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={28}
                tickMargin={4}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `${value}`}
                    indicator="line"
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="runs"
                stroke="var(--color-runs)"
                fill="url(#agent-mission-control-runs)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ChartContainer>
        </section>

        <section
          data-slot="agent-mission-control-incidents"
          className="flex flex-col gap-3 rounded-[1.75rem] border border-border/70 bg-card p-4 sm:p-5"
          aria-labelledby="agent-mission-control-incidents-title"
        >
          <header className="flex items-baseline justify-between gap-3">
            <h3
              id="agent-mission-control-incidents-title"
              className="text-sm font-medium tracking-[-0.01em]"
            >
              Incident Activity
            </h3>
            <p className="text-xs tabular-nums text-muted-foreground">
              {INCIDENTS.length}건
            </p>
          </header>
          <ol className="flex flex-col gap-2.5">
            {INCIDENTS.map((incident) => (
              <li
                key={incident.id}
                className="flex flex-col gap-1.5 rounded-2xl border border-border/60 px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium tracking-[-0.01em]">
                      {incident.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {incident.agent} · {incident.time}
                    </p>
                  </div>
                  <SeverityBadge severity={incident.severity} />
                </div>
                <p className="text-xs leading-5 text-pretty text-muted-foreground">
                  {incident.description}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {incident.resolved ? "해결됨" : "진행 중"}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setSelectedId(null)
        }}
      >
        <SheetContent
          className="flex w-full flex-col gap-0 sm:max-w-xl"
          side="right"
        >
          <SheetHeader>
            <SheetTitle>{selected?.runId ?? "실행 상세"}</SheetTitle>
            <SheetDescription>
              {selected
                ? `${selected.agent} · ${selected.environment === "production" ? "Production" : selected.environment === "staging" ? "Staging" : "Development"}`
                : "선택한 실행의 스텝과 설정을 확인합니다."}
            </SheetDescription>
          </SheetHeader>

          {selected ? (
            <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    selected.status === "failed"
                      ? "destructive"
                      : selected.status === "completed"
                        ? "success"
                        : selected.status === "running"
                          ? "info"
                          : "secondary"
                  }
                >
                  {RUN_QUEUE_STATUS_LABELS[selected.status]}
                </Badge>
                <RunQueueEnvironment environment={selected.environment} />
                <RunQueueOutcome outcome={selected.outcome} />
              </div>

              <p className="text-sm text-pretty text-muted-foreground">
                {selected.title}
              </p>

              <div className="grid gap-6">
                <StepTrace>
                  <StepTraceHeader>
                    <StepTraceTitle>Step Trace</StepTraceTitle>
                    <StepTraceMeta>
                      {failedAt
                        ? `${failedAt}/${selected.steps.length} 단계에서 실패`
                        : `${selected.steps.filter((step) => step.status === "completed").length}/${selected.steps.length} 단계 완료`}
                    </StepTraceMeta>
                  </StepTraceHeader>
                  <StepTraceList>
                    {selected.steps.map((step, index) => (
                      <StepTraceStep key={step.id} status={step.status}>
                        <StepTraceMark status={step.status}>
                          {step.status === "completed"
                            ? "✓"
                            : step.status === "failed"
                              ? "×"
                              : step.status === "running"
                                ? "…"
                                : String(index + 1)}
                        </StepTraceMark>
                        <StepTraceBody>
                          <StepTraceStepHeader>
                            <StepTraceStepTitle>
                              {step.title}
                            </StepTraceStepTitle>
                            <div className="flex shrink-0 items-center gap-2">
                              {step.duration ? (
                                <StepTraceDuration>
                                  {step.duration}
                                </StepTraceDuration>
                              ) : null}
                              <StepTraceStatusBadge status={step.status} />
                            </div>
                          </StepTraceStepHeader>
                          {step.description ? (
                            <StepTraceDescription>
                              {step.description}
                            </StepTraceDescription>
                          ) : null}
                          {step.tools?.length ? (
                            <StepTraceTools>
                              {step.tools.map((tool) => (
                                <StepTraceTool key={tool.name}>
                                  <StepTraceToolName>
                                    {tool.name}
                                  </StepTraceToolName>
                                  <div className="flex items-center gap-2">
                                    <StepTraceToolDuration>
                                      {tool.duration}
                                    </StepTraceToolDuration>
                                    <StepTraceToolStatus status={tool.status} />
                                  </div>
                                </StepTraceTool>
                              ))}
                            </StepTraceTools>
                          ) : null}
                          {step.error ? (
                            <StepTraceError>{step.error}</StepTraceError>
                          ) : null}
                        </StepTraceBody>
                      </StepTraceStep>
                    ))}
                  </StepTraceList>
                </StepTrace>

                <section className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4">
                  <h3 className="text-sm font-medium tracking-[-0.01em]">
                    Run Settings
                  </h3>
                  <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-4">
                    <DetailRow label="상태">
                      {RUN_QUEUE_STATUS_LABELS[selected.status]}
                    </DetailRow>
                    <DetailRow label="우선순위">{selected.priority}</DetailRow>
                    <DetailRow label="소유자">
                      <div className="flex flex-wrap items-center gap-2">
                        {selected.owners.map((owner) => (
                          <span
                            key={owner}
                            className="inline-flex items-center gap-1.5"
                          >
                            <Avatar size="sm">
                              <AvatarFallback>
                                {owner.slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{owner}</span>
                          </span>
                        ))}
                      </div>
                    </DetailRow>
                    <DetailRow label="재시도 정책">
                      {selected.retryPolicy}
                    </DetailRow>
                    <DetailRow label="최대 재시도">
                      {selected.maxRetries}
                    </DetailRow>
                    <DetailRow label="실패 시">{selected.onFailure}</DetailRow>
                    <DetailRow label="시작">
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          strokeWidth={2}
                          className="size-3.5"
                        />
                        {selected.startedAt}
                      </span>
                    </DetailRow>
                    <DetailRow label="최근 활동">
                      {selected.lastActivity}
                    </DetailRow>
                  </dl>
                </section>

                <ProvenancePanel>
                  <ProvenancePanelHeader>
                    <ProvenancePanelTitle>출처 · 모델</ProvenancePanelTitle>
                  </ProvenancePanelHeader>
                  <ProvenanceList>
                    <ProvenanceRow
                      source="ai"
                      verified={selected.status !== "failed"}
                    >
                      <ProvenanceRowLabel source="ai" />
                      <ProvenanceRowMeta>
                        {selected.agent} 자동 실행
                      </ProvenanceRowMeta>
                      <ProvenanceRowModel>{selected.model}</ProvenanceRowModel>
                      <ProvenanceRowStatus
                        verified={selected.status !== "failed"}
                      >
                        {selected.status === "failed" ? "검증 실패" : "확인됨"}
                      </ProvenanceRowStatus>
                    </ProvenanceRow>
                    <ProvenanceRow source="human" verified>
                      <ProvenanceRowLabel source="human" />
                      <ProvenanceRowMeta>
                        소유자 {selected.owners.join(", ")} · 읽기 전용 모니터링
                      </ProvenanceRowMeta>
                      <ProvenanceRowStatus verified>확인됨</ProvenanceRowStatus>
                    </ProvenanceRow>
                  </ProvenanceList>
                </ProvenancePanel>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </AdminShell>
  )
}

export default AgentMissionControl
