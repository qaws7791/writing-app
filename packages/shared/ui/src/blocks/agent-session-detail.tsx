"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BellIcon,
  Clock01Icon,
  FlashIcon,
  HashIcon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "#ui/lib/utils"
import { AdminShell } from "#ui/blocks/admin-shell"
import {
  AuditLog,
  AuditLogAction,
  AuditLogActor,
  AuditLogEntry,
  AuditLogEnvironment,
  AuditLogHeader,
  AuditLogKind,
  AuditLogList,
  AuditLogMeta,
  AuditLogTarget,
  AuditLogTime,
  AuditLogTitle,
} from "#ui/components/ui/audit-log"
import { Avatar, AvatarFallback } from "#ui/components/ui/avatar"
import { Badge } from "#ui/components/ui/badge"
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
  RUN_QUEUE_ENVIRONMENT_LABELS,
  RUN_QUEUE_OUTCOME_LABELS,
  RUN_QUEUE_STATUS_LABELS,
  RunQueueEnvironment,
  RunQueueItemProgress,
  RunQueueOutcome,
  type RunQueueEnv,
  type RunQueueOutcomeKind,
  type RunQueueStatus,
} from "#ui/components/ui/run-queue"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#ui/components/ui/tabs"

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

type SessionActivity = {
  id: string
  actor: string
  action: string
  target: string
  kind: "ai" | "content" | "permission"
  env: "sandbox" | "test" | "preview" | "live"
  dateTime: string
  relativeTime: string
}

const SESSION = {
  runId: "RUN-4822",
  agent: "Refund Resolver",
  title: "ORD-99214 중복 결제 환불 처리",
  status: "failed" as RunQueueStatus,
  outcome: "escalated" as RunQueueOutcomeKind,
  environment: "production" as RunQueueEnv,
  progress: 48,
  source: "webhook",
  channel: "payments",
  owners: ["김운영", "이결제"],
  priority: "높음",
  retryPolicy: "지수 백오프",
  maxRetries: "단계당 3회",
  onFailure: "소유자에게 알림",
  startedAt: "2026-08-04 12:38",
  lastActivity: "8분 전",
  model: "hermes-refund-v2",
  latency: "51s",
  stepLabel: "3/6 단계에서 실패",
  steps: [
    {
      id: "s1",
      title: "환불 접근 방식 계획",
      status: "completed" as StepTraceStatus,
      duration: "14s",
      tools: [
        {
          name: "orders.lookup",
          duration: "420ms",
          status: "succeeded" as const,
        },
      ],
    },
    {
      id: "s2",
      title: "원거래와 중복 결제 대조",
      status: "completed" as StepTraceStatus,
      duration: "31s",
      tools: [
        {
          name: "payments.match",
          duration: "1.2s",
          status: "succeeded" as const,
        },
      ],
    },
    {
      id: "s3",
      title: "부분 캡처 환불 요청",
      status: "failed" as StepTraceStatus,
      duration: "6s",
      description: "프로세서가 원카드 부분 캡처를 거절했습니다.",
      error:
        "processor_declined: partial capture on original card is not allowed for this merchant.",
      tools: [
        {
          name: "payments.refunds.create",
          duration: "890ms",
          status: "failed" as const,
        },
      ],
    },
    {
      id: "s4",
      title: "대체 환불 경로 제안",
      status: "pending" as StepTraceStatus,
    },
    {
      id: "s5",
      title: "고객 알림 초안",
      status: "pending" as StepTraceStatus,
    },
    {
      id: "s6",
      title: "감사 기록 작성",
      status: "pending" as StepTraceStatus,
    },
  ] satisfies StepData[],
}

const ACTIVITIES: SessionActivity[] = [
  {
    id: "act-1",
    actor: "시스템",
    action: "payments.refunds.create 호출 실패",
    target: "RUN-4822 · 단계 3",
    kind: "ai",
    env: "live",
    dateTime: "2026-08-04T12:46:00",
    relativeTime: "8분 전",
  },
  {
    id: "act-2",
    actor: "시스템",
    action: "에스컬레이션 큐로 이동",
    target: "Refund Resolver",
    kind: "ai",
    env: "live",
    dateTime: "2026-08-04T12:46:05",
    relativeTime: "8분 전",
  },
  {
    id: "act-3",
    actor: "김운영",
    action: "세션을 읽기 전용으로 열람",
    target: "RUN-4822",
    kind: "permission",
    env: "live",
    dateTime: "2026-08-04T12:50:00",
    relativeTime: "4분 전",
  },
  {
    id: "act-4",
    actor: "시스템",
    action: "원거래와 중복 결제 대조 완료",
    target: "RUN-4822 · 단계 2",
    kind: "ai",
    env: "live",
    dateTime: "2026-08-04T12:45:20",
    relativeTime: "9분 전",
  },
  {
    id: "act-5",
    actor: "시스템",
    action: "세션 시작 · webhook 수신",
    target: "payments · ORD-99214",
    kind: "content",
    env: "live",
    dateTime: "2026-08-04T12:38:00",
    relativeTime: "16분 전",
  },
]

const STATUS_BADGE_VARIANT: Record<
  RunQueueStatus,
  "info" | "secondary" | "destructive" | "success"
> = {
  running: "info",
  waiting: "secondary",
  failed: "destructive",
  completed: "success",
}

function DetailRow({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <dt className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="min-w-0 text-end text-sm text-pretty">{children}</dd>
    </div>
  )
}

function SessionHeader() {
  return (
    <section
      data-slot="agent-session-detail-header"
      className="flex flex-wrap items-start justify-between gap-4"
    >
      <div className="min-w-0 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {SESSION.runId}
          </span>
          <Badge variant={STATUS_BADGE_VARIANT[SESSION.status]}>
            {RUN_QUEUE_STATUS_LABELS[SESSION.status]}
          </Badge>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/8 px-2 py-0.5 text-[11px] font-medium text-success">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            Live
          </span>
        </div>

        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em] text-pretty sm:text-xl">
            {SESSION.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {SESSION.agent}
            <span className="mx-1.5 text-border">·</span>
            {RUN_QUEUE_ENVIRONMENT_LABELS[SESSION.environment]}
            <span className="mx-1.5 text-border">·</span>
            {SESSION.source} / {SESSION.channel}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {SESSION.owners.map((owner) => (
          <span
            key={owner}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2 py-1 text-xs"
          >
            <Avatar size="sm">
              <AvatarFallback>{owner.slice(0, 1)}</AvatarFallback>
            </Avatar>
            {owner}
          </span>
        ))}
        <RunQueueOutcome outcome={SESSION.outcome} />
      </div>
    </section>
  )
}

function RunSettingsPanel() {
  return (
    <aside
      data-slot="agent-session-detail-settings"
      className="flex flex-col gap-5 rounded-[1.5rem] border border-border/70 bg-card p-4 sm:p-5"
    >
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium tracking-[-0.01em]">Run Settings</h3>
        <RunQueueItemProgress value={SESSION.progress} />
      </header>

      <dl className="flex flex-col">
        <DetailRow label="상태">
          <Badge variant={STATUS_BADGE_VARIANT[SESSION.status]}>
            {RUN_QUEUE_STATUS_LABELS[SESSION.status]}
          </Badge>
        </DetailRow>
        <DetailRow
          label="우선순위"
          icon={
            <HugeiconsIcon
              icon={FlashIcon}
              strokeWidth={2}
              className="size-3.5"
            />
          }
        >
          {SESSION.priority}
        </DetailRow>
        <DetailRow label="환경">
          <RunQueueEnvironment environment={SESSION.environment} />
        </DetailRow>
        <DetailRow label="결과">
          {RUN_QUEUE_OUTCOME_LABELS[SESSION.outcome]}
        </DetailRow>
        <DetailRow label="소유자">
          <div className="flex flex-wrap justify-end gap-1.5">
            {SESSION.owners.map((owner) => (
              <span key={owner} className="inline-flex items-center gap-1">
                <Avatar size="sm">
                  <AvatarFallback>{owner.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span>{owner}</span>
              </span>
            ))}
          </div>
        </DetailRow>
        <DetailRow
          label="재시도 정책"
          icon={
            <HugeiconsIcon
              icon={Refresh01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
          }
        >
          {SESSION.retryPolicy}
        </DetailRow>
        <DetailRow
          label="최대 재시도"
          icon={
            <HugeiconsIcon
              icon={HashIcon}
              strokeWidth={2}
              className="size-3.5"
            />
          }
        >
          {SESSION.maxRetries}
        </DetailRow>
        <DetailRow
          label="실패 시"
          icon={
            <HugeiconsIcon
              icon={BellIcon}
              strokeWidth={2}
              className="size-3.5"
            />
          }
        >
          {SESSION.onFailure}
        </DetailRow>
        <DetailRow
          label="시작"
          icon={
            <HugeiconsIcon
              icon={Clock01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
          }
        >
          <span className="tabular-nums">{SESSION.startedAt}</span>
        </DetailRow>
        <DetailRow label="최근 활동">
          <span className="tabular-nums">{SESSION.lastActivity}</span>
        </DetailRow>
        <DetailRow label="지연">
          <span className="tabular-nums">{SESSION.latency}</span>
        </DetailRow>
        <DetailRow label="모델">
          <code className="font-mono text-[11px]">{SESSION.model}</code>
        </DetailRow>
      </dl>

      <p className="rounded-xl bg-muted/50 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
        읽기 전용 세션입니다. 재시도·승인 같은 쓰기 행동은 이 화면에서 실행하지
        않습니다.
      </p>
    </aside>
  )
}

function TracePanel() {
  return (
    <StepTrace
      data-slot="agent-session-detail-trace"
      className="rounded-[1.5rem] border border-border/70 bg-card p-4 sm:p-5"
    >
      <StepTraceHeader>
        <StepTraceTitle>Step Trace</StepTraceTitle>
        <StepTraceMeta>{SESSION.stepLabel}</StepTraceMeta>
      </StepTraceHeader>
      <StepTraceList>
        {SESSION.steps.map((step, index) => (
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
                <StepTraceStepTitle>{step.title}</StepTraceStepTitle>
                <div className="flex shrink-0 items-center gap-2">
                  {step.duration ? (
                    <StepTraceDuration>{step.duration}</StepTraceDuration>
                  ) : null}
                  <StepTraceStatusBadge status={step.status} />
                </div>
              </StepTraceStepHeader>
              {step.description ? (
                <StepTraceDescription>{step.description}</StepTraceDescription>
              ) : null}
              {step.tools?.length ? (
                <StepTraceTools>
                  {step.tools.map((tool) => (
                    <StepTraceTool key={tool.name}>
                      <StepTraceToolName>{tool.name}</StepTraceToolName>
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
  )
}

function ActivityPanel() {
  return (
    <AuditLog
      data-slot="agent-session-detail-activity"
      className="rounded-[1.5rem] border border-border/70 bg-card p-4 sm:p-5"
    >
      <AuditLogHeader>
        <AuditLogTitle>세션 활동</AuditLogTitle>
        <AuditLogMeta>{ACTIVITIES.length}건 · 읽기 전용</AuditLogMeta>
      </AuditLogHeader>
      <AuditLogList>
        {ACTIVITIES.map((entry) => (
          <AuditLogEntry key={entry.id}>
            <AuditLogActor>{entry.actor}</AuditLogActor>
            <AuditLogAction>{entry.action}</AuditLogAction>
            <AuditLogTarget>{entry.target}</AuditLogTarget>
            <AuditLogKind kind={entry.kind} />
            <AuditLogEnvironment env={entry.env} />
            <AuditLogTime dateTime={entry.dateTime}>
              {entry.relativeTime}
            </AuditLogTime>
          </AuditLogEntry>
        ))}
      </AuditLogList>
    </AuditLog>
  )
}

function ProvenancePanelSection() {
  return (
    <ProvenancePanel
      data-slot="agent-session-detail-provenance"
      className="rounded-[1.5rem] border border-border/70 bg-card p-4 sm:p-5"
    >
      <ProvenancePanelHeader>
        <ProvenancePanelTitle>출처 · 모델</ProvenancePanelTitle>
      </ProvenancePanelHeader>
      <ProvenanceList>
        <ProvenanceRow source="ai" verified={false}>
          <ProvenanceRowLabel source="ai" />
          <ProvenanceRowMeta>
            {SESSION.agent} 자동 실행 · 단계 3에서 중단
          </ProvenanceRowMeta>
          <ProvenanceRowModel>{SESSION.model}</ProvenanceRowModel>
          <ProvenanceRowStatus verified={false}>검증 실패</ProvenanceRowStatus>
        </ProvenanceRow>
        <ProvenanceRow source="external" verified>
          <ProvenanceRowLabel source="external" />
          <ProvenanceRowMeta>
            결제 프로세서 응답 · payments.refunds.create
          </ProvenanceRowMeta>
          <ProvenanceRowStatus verified>확인됨</ProvenanceRowStatus>
        </ProvenanceRow>
        <ProvenanceRow source="human" verified>
          <ProvenanceRowLabel source="human" />
          <ProvenanceRowMeta>
            소유자 {SESSION.owners.join(", ")} · 읽기 전용 모니터링
          </ProvenanceRowMeta>
          <ProvenanceRowStatus verified>확인됨</ProvenanceRowStatus>
        </ProvenanceRow>
      </ProvenanceList>
    </ProvenancePanel>
  )
}

/**
 * Read-only Hermes agent session detail: step trace, settings, activity, and provenance.
 */
export function AgentSessionDetail({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <AdminShell
      data-slot="agent-session-detail"
      activeNav="agents"
      title={SESSION.title}
      description={`${SESSION.runId} · ${SESSION.agent}`}
      breadcrumb={[{ label: "미션 컨트롤", href: "#agents" }]}
      className={cn(className)}
      {...props}
    >
      <SessionHeader />

      <div
        data-slot="agent-session-detail-body"
        className="grid gap-6 @[56rem]/admin-main:grid-cols-[minmax(0,1.7fr)_minmax(0,0.9fr)] @[56rem]/admin-main:items-start"
      >
        <Tabs defaultValue="trace" className="min-w-0 gap-4">
          <TabsList variant="line" className="w-full justify-start sm:w-auto">
            <TabsTrigger value="trace">트레이스</TabsTrigger>
            <TabsTrigger value="activity">활동</TabsTrigger>
            <TabsTrigger value="provenance">출처</TabsTrigger>
          </TabsList>
          <TabsContent value="trace" className="mt-0">
            <TracePanel />
          </TabsContent>
          <TabsContent value="activity" className="mt-0">
            <ActivityPanel />
          </TabsContent>
          <TabsContent value="provenance" className="mt-0">
            <ProvenancePanelSection />
          </TabsContent>
        </Tabs>

        <div className="flex min-w-0 flex-col gap-4 @[56rem]/admin-main:sticky @[56rem]/admin-main:top-20">
          <RunSettingsPanel />
        </div>
      </div>
    </AdminShell>
  )
}

export default AgentSessionDetail
