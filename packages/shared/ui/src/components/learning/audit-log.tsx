import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type AuditLogEnv = "sandbox" | "test" | "preview" | "live"
type AuditLogKindValue = "publish" | "permission" | "content" | "ai" | "restore"

const AUDIT_LOG_ENV_LABELS: Record<AuditLogEnv, string> = {
  sandbox: "Sandbox",
  test: "Test",
  preview: "Preview",
  live: "Live",
}

const AUDIT_LOG_KIND_LABELS: Record<AuditLogKindValue, string> = {
  publish: "게시",
  permission: "권한",
  content: "콘텐츠",
  ai: "AI",
  restore: "복원",
}

function AuditLog({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="audit-log"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  )
}

function AuditLogHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="audit-log-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function AuditLogTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="audit-log-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function AuditLogMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="audit-log-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function AuditLogList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="audit-log-list"
      className={cn("flex w-full flex-col gap-0.5", className)}
      {...props}
    />
  )
}

function AuditLogEntry({
  className,
  selected = false,
  ...props
}: React.ComponentProps<"li"> & {
  selected?: boolean
}) {
  return (
    <li
      data-slot="audit-log-entry"
      data-selected={selected || undefined}
      className={cn(
        "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 rounded-2xl px-2.5 py-2.5 text-sm hover:bg-muted/40",
        "data-[selected=true]:bg-muted/50",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className
      )}
      {...props}
    />
  )
}

function AuditLogActor({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="audit-log-actor"
      className={cn(
        "shrink-0 text-xs font-medium tracking-[-0.01em]",
        className
      )}
      {...props}
    />
  )
}

function AuditLogAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="audit-log-action"
      className={cn("min-w-0 text-sm text-pretty", className)}
      {...props}
    />
  )
}

function AuditLogTarget({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="audit-log-target"
      className={cn("col-start-2 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

const auditLogKindVariants = cva(
  "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-[-0.01em]",
  {
    variants: {
      kind: {
        publish: "border-border/80 bg-muted/30 text-muted-foreground",
        permission: "border-border/80 bg-card text-foreground/80",
        content: "border-border/70 bg-muted/20 text-muted-foreground",
        ai: "border-foreground/12 bg-foreground/[0.03] text-foreground/75",
        restore: "border-foreground/20 bg-foreground/[0.06] text-foreground",
      },
    },
    defaultVariants: {
      kind: "content",
    },
  }
)

function AuditLogKind({
  className,
  kind = "content",
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof auditLogKindVariants> & {
    kind?: AuditLogKindValue
  }) {
  return (
    <span
      data-slot="audit-log-kind"
      data-kind={kind}
      className={cn(
        "col-start-2 w-fit",
        auditLogKindVariants({ kind }),
        className
      )}
      {...props}
    >
      {children ?? AUDIT_LOG_KIND_LABELS[kind]}
    </span>
  )
}

const auditLogEnvironmentVariants = cva(
  "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-[0.04em] uppercase",
  {
    variants: {
      env: {
        sandbox: "border-border/80 bg-muted/40 text-muted-foreground",
        test: "border-border/80 bg-card text-muted-foreground",
        preview: "border-foreground/15 bg-foreground/[0.04] text-foreground/80",
        live: "border-foreground/20 bg-foreground text-background",
      },
    },
    defaultVariants: {
      env: "sandbox",
    },
  }
)

function AuditLogEnvironment({
  className,
  env = "sandbox",
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof auditLogEnvironmentVariants> & {
    env?: AuditLogEnv
  }) {
  return (
    <span
      data-slot="audit-log-environment"
      data-env={env}
      className={cn(
        "col-start-3 row-start-1 justify-self-end",
        auditLogEnvironmentVariants({ env }),
        className
      )}
      {...props}
    >
      {children ?? AUDIT_LOG_ENV_LABELS[env]}
    </span>
  )
}

function AuditLogTime({ className, ...props }: React.ComponentProps<"time">) {
  return (
    <time
      data-slot="audit-log-time"
      className={cn(
        "col-start-3 row-start-2 shrink-0 justify-self-end text-[11px] tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function AuditLogRestore({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="audit-log-restore"
      className={cn(
        "col-start-3 shrink-0 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline",
        className
      )}
      {...props}
    />
  )
}

function AuditLogEmpty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="audit-log-empty"
      className={cn(
        "flex w-full flex-col items-center justify-center py-6",
        className
      )}
      {...props}
    />
  )
}

export {
  AuditLog,
  AuditLogHeader,
  AuditLogTitle,
  AuditLogMeta,
  AuditLogList,
  AuditLogEntry,
  AuditLogActor,
  AuditLogAction,
  AuditLogTarget,
  AuditLogKind,
  AuditLogEnvironment,
  AuditLogTime,
  AuditLogRestore,
  AuditLogEmpty,
  auditLogEnvironmentVariants,
  auditLogKindVariants,
  AUDIT_LOG_ENV_LABELS,
  AUDIT_LOG_KIND_LABELS,
  type AuditLogEnv,
  type AuditLogKindValue,
}
