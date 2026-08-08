import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type AdminOverviewSeverity = "info" | "warning" | "urgent"

const ADMIN_OVERVIEW_SEVERITY_LABELS: Record<AdminOverviewSeverity, string> = {
  info: "정보",
  warning: "주의",
  urgent: "긴급",
}

function AdminOverview({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="admin-overview"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  )
}

function AdminOverviewHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="admin-overview-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function AdminOverviewTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="admin-overview-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function AdminOverviewMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="admin-overview-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function AdminOverviewList({
  className,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="admin-overview-list"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

const adminOverviewItemVariants = cva(
  "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 rounded-2xl border px-3.5 py-3",
  {
    variants: {
      severity: {
        info: "border-border/70 bg-card",
        warning:
          "border-foreground/12 bg-foreground/[0.03] dark:bg-foreground/[0.05]",
        urgent:
          "border-foreground/20 bg-foreground/[0.04] ring-1 ring-foreground/10 dark:bg-foreground/[0.06]",
      },
    },
    defaultVariants: {
      severity: "info",
    },
  }
)

function AdminOverviewItem({
  className,
  severity = "info",
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof adminOverviewItemVariants> & {
    severity?: AdminOverviewSeverity
  }) {
  return (
    <li
      data-slot="admin-overview-item"
      data-severity={severity}
      className={cn(adminOverviewItemVariants({ severity }), className)}
      {...props}
    >
      {children}
    </li>
  )
}

function AdminOverviewItemTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="admin-overview-item-title"
      className={cn(
        "col-start-1 row-start-1 text-sm font-medium tracking-[-0.01em] text-pretty",
        className
      )}
      {...props}
    />
  )
}

function AdminOverviewItemReason({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="admin-overview-item-reason"
      className={cn(
        "col-start-1 row-start-2 text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function AdminOverviewItemMeta({
  className,
  severity,
  children,
  ...props
}: React.ComponentProps<"p"> & {
  severity?: AdminOverviewSeverity
}) {
  return (
    <p
      data-slot="admin-overview-item-meta"
      data-severity={severity}
      className={cn(
        "col-start-1 row-start-3 text-[11px] tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    >
      {children ??
        (severity ? ADMIN_OVERVIEW_SEVERITY_LABELS[severity] : undefined)}
    </p>
  )
}

function AdminOverviewItemActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="admin-overview-item-actions"
      className={cn(
        "col-start-2 row-span-3 flex shrink-0 items-start gap-1",
        className
      )}
      {...props}
    />
  )
}

export {
  AdminOverview,
  AdminOverviewHeader,
  AdminOverviewTitle,
  AdminOverviewMeta,
  AdminOverviewList,
  AdminOverviewItem,
  AdminOverviewItemTitle,
  AdminOverviewItemReason,
  AdminOverviewItemMeta,
  AdminOverviewItemActions,
  adminOverviewItemVariants,
  ADMIN_OVERVIEW_SEVERITY_LABELS,
  type AdminOverviewSeverity,
}
