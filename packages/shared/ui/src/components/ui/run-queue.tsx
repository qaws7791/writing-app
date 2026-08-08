import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type RunQueueStatus = "running" | "waiting" | "failed" | "completed"
type RunQueueEnv = "production" | "staging" | "development"
type RunQueueOutcomeKind =
  | "on-track"
  | "needs-approval"
  | "retrying"
  | "escalated"
  | "done"

const RUN_QUEUE_STATUS_LABELS: Record<RunQueueStatus, string> = {
  running: "실행 중",
  waiting: "대기",
  failed: "실패",
  completed: "완료",
}

const RUN_QUEUE_ENVIRONMENT_LABELS: Record<RunQueueEnv, string> = {
  production: "Production",
  staging: "Staging",
  development: "Development",
}

const RUN_QUEUE_OUTCOME_LABELS: Record<RunQueueOutcomeKind, string> = {
  "on-track": "정상",
  "needs-approval": "승인 필요",
  retrying: "재시도",
  escalated: "에스컬레이션",
  done: "완료",
}

const RUN_QUEUE_STATUS_HINTS: Record<RunQueueStatus, string> = {
  running: "지금 스트리밍 중인 실행",
  waiting: "승인·한도·스케줄 뒤에서 대기",
  failed: "재시도나 개입이 필요한 중단",
  completed: "최근 24시간 내 완료",
}

function RunQueue({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="run-queue"
      className={cn(
        "@container/run-queue flex w-full flex-col gap-4",
        className
      )}
      {...props}
    />
  )
}

function RunQueueHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="run-queue-header"
      className={cn(
        "flex flex-wrap items-end justify-between gap-3",
        className
      )}
      {...props}
    />
  )
}

function RunQueueTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="run-queue-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function RunQueueMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="run-queue-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function RunQueueToolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="run-queue-toolbar"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

function RunQueueSummary({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="run-queue-summary"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

const runQueueSummaryChipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[-0.01em] tabular-nums",
  {
    variants: {
      tone: {
        default: "border-border/80 bg-card text-muted-foreground",
        warning: "border-warning/25 bg-warning/8 text-warning",
        danger: "border-destructive/25 bg-destructive/8 text-destructive",
        success: "border-success/25 bg-success/8 text-success",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
)

function RunQueueSummaryChip({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof runQueueSummaryChipVariants>) {
  return (
    <li
      data-slot="run-queue-summary-chip"
      data-tone={tone}
      className={cn(runQueueSummaryChipVariants({ tone }), className)}
      {...props}
    />
  )
}

function RunQueueGroups({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="run-queue-groups"
      className={cn("flex flex-col gap-5", className)}
      {...props}
    />
  )
}

const runQueueGroupVariants = cva("flex flex-col gap-2", {
  variants: {
    status: {
      running: "",
      waiting: "",
      failed: "",
      completed: "",
    },
  },
  defaultVariants: {
    status: "running",
  },
})

function RunQueueGroup({
  className,
  status = "running",
  ...props
}: React.ComponentProps<"section"> &
  VariantProps<typeof runQueueGroupVariants> & {
    status?: RunQueueStatus
  }) {
  return (
    <section
      data-slot="run-queue-group"
      data-status={status}
      className={cn(runQueueGroupVariants({ status }), className)}
      {...props}
    />
  )
}

function RunQueueGroupHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="run-queue-group-header"
      className={cn(
        "flex items-center justify-between gap-3 px-0.5",
        className
      )}
      {...props}
    />
  )
}

const runQueueGroupDotVariants = cva("size-2 shrink-0 rounded-full", {
  variants: {
    status: {
      running: "bg-info",
      waiting: "bg-muted-foreground/50",
      failed: "bg-destructive",
      completed: "bg-success",
    },
  },
  defaultVariants: {
    status: "running",
  },
})

function RunQueueGroupDot({
  className,
  status = "running",
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof runQueueGroupDotVariants> & {
    status?: RunQueueStatus
  }) {
  return (
    <span
      data-slot="run-queue-group-dot"
      data-status={status}
      className={cn(runQueueGroupDotVariants({ status }), className)}
      {...props}
    />
  )
}

function RunQueueGroupTitle({
  className,
  status,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  status?: RunQueueStatus
}) {
  return (
    <div
      data-slot="run-queue-group-title"
      className={cn(
        "flex items-center gap-2 text-sm font-medium tracking-[-0.01em]",
        className
      )}
      {...props}
    >
      {status ? <RunQueueGroupDot status={status} /> : null}
      {children ?? (status ? RUN_QUEUE_STATUS_LABELS[status] : undefined)}
    </div>
  )
}

function RunQueueGroupHint({
  className,
  status,
  children,
  ...props
}: React.ComponentProps<"p"> & {
  status?: RunQueueStatus
}) {
  return (
    <p
      data-slot="run-queue-group-hint"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    >
      {children ?? (status ? RUN_QUEUE_STATUS_HINTS[status] : undefined)}
    </p>
  )
}

function RunQueueGroupCount({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="run-queue-group-count"
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function RunQueueList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="run-queue-list"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

const runQueueItemVariants = cva(
  [
    "grid gap-3 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
    "outline-none transition-[background-color,border-color] hover:bg-muted/30",
    "focus-visible:ring-2 focus-visible:ring-ring/40",
    "data-[selected=true]:border-foreground/15 data-[selected=true]:bg-muted/40",
  ].join(" "),
  {
    variants: {
      status: {
        running: "",
        waiting: "",
        failed: "border-destructive/20",
        completed: "",
      },
    },
    defaultVariants: {
      status: "running",
    },
  }
)

function RunQueueItem({
  className,
  status = "running",
  selected = false,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof runQueueItemVariants> & {
    status?: RunQueueStatus
    selected?: boolean
  }) {
  return (
    <li
      data-slot="run-queue-item"
      data-status={status}
      data-selected={selected || undefined}
      className={cn(
        runQueueItemVariants({ status }),
        "grid-cols-[auto_minmax(0,1fr)_auto] items-center @[40rem]/run-queue:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto]",
        className
      )}
      {...props}
    />
  )
}

function RunQueueItemIcon({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="run-queue-item-icon"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl border border-border/70 bg-muted/40 text-muted-foreground [&_svg]:size-4",
        className
      )}
      {...props}
    />
  )
}

function RunQueueItemBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="run-queue-item-body"
      className={cn("min-w-0 flex flex-col gap-0.5", className)}
      {...props}
    />
  )
}

function RunQueueItemTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="run-queue-item-title"
      className={cn(
        "truncate text-sm font-medium tracking-[-0.01em]",
        className
      )}
      {...props}
    />
  )
}

function RunQueueItemStep({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="run-queue-item-step"
      className={cn(
        "truncate text-xs leading-5 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

const runQueueEnvironmentVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-[-0.01em]",
  {
    variants: {
      environment: {
        production:
          "border-foreground/15 bg-foreground/[0.04] text-foreground/80",
        staging: "border-warning/25 bg-warning/8 text-warning",
        development: "border-purple/25 bg-purple/8 text-purple",
      },
    },
    defaultVariants: {
      environment: "production",
    },
  }
)

function RunQueueEnvironment({
  className,
  environment = "production",
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof runQueueEnvironmentVariants> & {
    environment?: RunQueueEnv
  }) {
  return (
    <span
      data-slot="run-queue-environment"
      data-environment={environment}
      className={cn(runQueueEnvironmentVariants({ environment }), className)}
      {...props}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          environment === "production" && "bg-foreground/70",
          environment === "staging" && "bg-warning",
          environment === "development" && "bg-purple"
        )}
        aria-hidden
      />
      {children ?? RUN_QUEUE_ENVIRONMENT_LABELS[environment]}
    </span>
  )
}

function RunQueueItemTime({
  className,
  ...props
}: React.ComponentProps<"time">) {
  return (
    <time
      data-slot="run-queue-item-time"
      className={cn(
        "hidden text-xs tabular-nums text-muted-foreground @[40rem]/run-queue:inline",
        className
      )}
      {...props}
    />
  )
}

function RunQueueItemProgress({
  className,
  value = 0,
  ...props
}: React.ComponentProps<"div"> & {
  value?: number
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = 14
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      data-slot="run-queue-item-progress"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative grid size-10 shrink-0 place-items-center text-[10px] font-medium tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    >
      <svg
        viewBox="0 0 36 36"
        className="absolute inset-0 size-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth="3"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          className="stroke-foreground transition-[stroke-dashoffset] duration-500 ease-quiet"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span>{clamped}%</span>
    </div>
  )
}

const runQueueOutcomeVariants = cva(
  "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-[-0.01em]",
  {
    variants: {
      outcome: {
        "on-track": "border-success/30 bg-transparent text-success",
        "needs-approval": "border-warning/25 bg-warning/10 text-warning",
        retrying: "border-purple/25 bg-transparent text-purple",
        escalated: "border-destructive/25 bg-destructive/10 text-destructive",
        done: "border-border/80 bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: {
      outcome: "on-track",
    },
  }
)

function RunQueueOutcome({
  className,
  outcome = "on-track",
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof runQueueOutcomeVariants> & {
    outcome?: RunQueueOutcomeKind
  }) {
  return (
    <span
      data-slot="run-queue-outcome"
      data-outcome={outcome}
      className={cn(runQueueOutcomeVariants({ outcome }), className)}
      {...props}
    >
      {children ?? RUN_QUEUE_OUTCOME_LABELS[outcome]}
    </span>
  )
}

function RunQueueEmpty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="run-queue-empty"
      className={cn(
        "rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function RunQueueFooter({
  className,
  ...props
}: React.ComponentProps<"footer">) {
  return (
    <footer
      data-slot="run-queue-footer"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  RunQueue,
  RunQueueHeader,
  RunQueueTitle,
  RunQueueMeta,
  RunQueueToolbar,
  RunQueueSummary,
  RunQueueSummaryChip,
  RunQueueGroups,
  RunQueueGroup,
  RunQueueGroupHeader,
  RunQueueGroupDot,
  RunQueueGroupTitle,
  RunQueueGroupHint,
  RunQueueGroupCount,
  RunQueueList,
  RunQueueItem,
  RunQueueItemIcon,
  RunQueueItemBody,
  RunQueueItemTitle,
  RunQueueItemStep,
  RunQueueEnvironment,
  RunQueueItemTime,
  RunQueueItemProgress,
  RunQueueOutcome,
  RunQueueEmpty,
  RunQueueFooter,
  runQueueItemVariants,
  runQueueEnvironmentVariants,
  runQueueOutcomeVariants,
  RUN_QUEUE_STATUS_LABELS,
  RUN_QUEUE_ENVIRONMENT_LABELS,
  RUN_QUEUE_OUTCOME_LABELS,
  RUN_QUEUE_STATUS_HINTS,
  type RunQueueStatus,
  type RunQueueEnv,
  type RunQueueOutcomeKind,
}
