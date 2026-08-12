import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type FeedbackPriority = "high" | "medium" | "low"

const FEEDBACK_PRIORITY_LABELS: Record<FeedbackPriority, string> = {
  high: "우선",
  medium: "보통",
  low: "참고",
}

function FeedbackSummary({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="feedback-summary"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

function FeedbackSummaryHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="feedback-summary-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function FeedbackSummaryTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feedback-summary-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function FeedbackSummaryMeta({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="feedback-summary-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function FeedbackSummaryPriority({
  className,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="feedback-summary-priority"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

const feedbackItemVariants = cva(
  "flex flex-col gap-1.5 rounded-2xl border px-3.5 py-3",
  {
    variants: {
      priority: {
        high: "border-foreground/15 bg-foreground/[0.03]",
        medium: "border-border/80 bg-card",
        low: "border-border/60 bg-muted/20",
      },
    },
    defaultVariants: {
      priority: "medium",
    },
  }
)

function FeedbackSummaryItem({
  className,
  priority = "medium",
  scope,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof feedbackItemVariants> & {
    priority?: FeedbackPriority
    scope?: string
  }) {
  return (
    <li
      data-slot="feedback-summary-item"
      data-priority={priority}
      data-scope={scope}
      className={cn(feedbackItemVariants({ priority }), className)}
      {...props}
    />
  )
}

function FeedbackSummaryItemTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feedback-summary-item-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function FeedbackSummaryItemScope({
  className,
  priority,
  children,
  ...props
}: React.ComponentProps<"span"> & {
  priority?: FeedbackPriority
}) {
  return (
    <span
      data-slot="feedback-summary-item-scope"
      className={cn(
        "text-[11px] font-medium tracking-[0.02em] text-muted-foreground",
        className
      )}
      {...props}
    >
      {children ??
        (priority !== undefined
          ? FEEDBACK_PRIORITY_LABELS[priority]
          : undefined)}
    </span>
  )
}

function FeedbackSummaryItemBody({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="feedback-summary-item-body"
      className={cn(
        "text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function FeedbackSummaryActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feedback-summary-actions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

export {
  FeedbackSummary,
  FeedbackSummaryHeader,
  FeedbackSummaryTitle,
  FeedbackSummaryMeta,
  FeedbackSummaryPriority,
  FeedbackSummaryItem,
  FeedbackSummaryItemTitle,
  FeedbackSummaryItemScope,
  FeedbackSummaryItemBody,
  FeedbackSummaryActions,
  feedbackItemVariants,
  FEEDBACK_PRIORITY_LABELS,
  type FeedbackPriority,
}
