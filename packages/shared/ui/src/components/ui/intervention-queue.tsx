import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type InterventionReason = "repeated-errors" | "inactive" | "late-submission"

const INTERVENTION_REASON_LABELS: Record<InterventionReason, string> = {
  "repeated-errors": "반복 오답",
  inactive: "비활성",
  "late-submission": "지연 제출",
}

function InterventionQueue({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="intervention-queue"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  )
}

function InterventionQueueHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="intervention-queue-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function InterventionQueueTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="intervention-queue-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function InterventionQueueMeta({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="intervention-queue-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function InterventionQueueList({
  className,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="intervention-queue-list"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

const interventionItemVariants = cva(
  "flex flex-col gap-1.5 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
  {
    variants: {
      reason: {
        "repeated-errors":
          "border-foreground/15 bg-foreground/[0.03] dark:bg-foreground/[0.05]",
        inactive: "",
        "late-submission": "",
      },
    },
    defaultVariants: {
      reason: "inactive",
    },
  }
)

function InterventionItem({
  className,
  reason = "inactive",
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof interventionItemVariants> & {
    reason?: InterventionReason
  }) {
  return (
    <li
      data-slot="intervention-item"
      data-reason={reason}
      className={cn(interventionItemVariants({ reason }), className)}
      {...props}
    >
      {children}
    </li>
  )
}

function InterventionItemName({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="intervention-item-name"
      className={cn(
        "text-sm font-medium tracking-[-0.01em] text-pretty",
        className
      )}
      {...props}
    />
  )
}

function InterventionItemReason({
  className,
  reason,
  children,
  ...props
}: React.ComponentProps<"p"> & {
  reason?: InterventionReason
}) {
  return (
    <p
      data-slot="intervention-item-reason"
      data-reason={reason}
      className={cn("text-xs leading-5 text-muted-foreground", className)}
      {...props}
    >
      {children ?? (reason ? INTERVENTION_REASON_LABELS[reason] : undefined)}
    </p>
  )
}

function InterventionItemEvidence({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="intervention-item-evidence"
      className={cn(
        "text-xs leading-5 text-pretty text-muted-foreground tabular-nums",
        className
      )}
      {...props}
    />
  )
}

function InterventionItemActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="intervention-item-actions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

export {
  InterventionQueue,
  InterventionQueueHeader,
  InterventionQueueTitle,
  InterventionQueueMeta,
  InterventionQueueList,
  InterventionItem,
  InterventionItemName,
  InterventionItemReason,
  InterventionItemEvidence,
  InterventionItemActions,
  interventionItemVariants,
  INTERVENTION_REASON_LABELS,
  type InterventionReason,
}
