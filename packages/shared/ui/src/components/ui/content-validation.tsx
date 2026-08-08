import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type ContentValidationSeverity = "error" | "warning" | "info"

const CONTENT_VALIDATION_SEVERITY_LABELS: Record<
  ContentValidationSeverity,
  string
> = {
  error: "오류",
  warning: "경고",
  info: "정보",
}

function ContentValidation({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="content-validation"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  )
}

function ContentValidationHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="content-validation-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function ContentValidationTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="content-validation-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function ContentValidationSummary({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="content-validation-summary"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function ContentValidationList({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="content-validation-list"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

const contentValidationIssueVariants = cva(
  "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2.5 gap-y-1 rounded-2xl border px-3.5 py-3",
  {
    variants: {
      severity: {
        error:
          "border-foreground/20 bg-foreground/[0.04] dark:bg-foreground/[0.06]",
        warning:
          "border-foreground/12 bg-foreground/[0.03] dark:bg-foreground/[0.05]",
        info: "border-border/70 bg-card",
      },
    },
    defaultVariants: {
      severity: "info",
    },
  }
)

const contentValidationIssueMarkVariants = cva(
  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium",
  {
    variants: {
      severity: {
        error: "border-foreground/20 bg-foreground text-background",
        warning: "border-foreground/15 bg-foreground/80 text-background",
        info: "border-border/70 bg-muted/40 text-muted-foreground",
      },
    },
    defaultVariants: {
      severity: "info",
    },
  }
)

function ContentValidationIssue({
  className,
  severity = "info",
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof contentValidationIssueVariants> & {
    severity?: ContentValidationSeverity
  }) {
  return (
    <li
      data-slot="content-validation-issue"
      data-severity={severity}
      className={cn(contentValidationIssueVariants({ severity }), className)}
      {...props}
    >
      <span
        data-slot="content-validation-issue-mark"
        data-severity={severity}
        aria-hidden
        className={cn(contentValidationIssueMarkVariants({ severity }))}
      >
        {severity === "error" ? "!" : severity === "warning" ? "?" : "i"}
      </span>
      {children}
    </li>
  )
}

function ContentValidationIssueTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="content-validation-issue-title"
      className={cn(
        "col-start-2 row-start-1 text-sm font-medium tracking-[-0.01em] text-pretty",
        className
      )}
      {...props}
    />
  )
}

function ContentValidationIssueDetail({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="content-validation-issue-detail"
      className={cn(
        "col-start-2 row-start-2 text-xs leading-5 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function ContentValidationIssueMeta({
  className,
  severity,
  children,
  ...props
}: React.ComponentProps<"p"> & {
  severity?: ContentValidationSeverity
}) {
  return (
    <p
      data-slot="content-validation-issue-meta"
      data-severity={severity}
      className={cn(
        "col-start-2 row-start-3 text-[11px] tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    >
      {children ??
        (severity ? CONTENT_VALIDATION_SEVERITY_LABELS[severity] : undefined)}
    </p>
  )
}

function ContentValidationIssueActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="content-validation-issue-actions"
      className={cn(
        "col-start-3 row-span-3 flex shrink-0 items-start gap-1",
        className
      )}
      {...props}
    />
  )
}

export {
  ContentValidation,
  ContentValidationHeader,
  ContentValidationTitle,
  ContentValidationSummary,
  ContentValidationList,
  ContentValidationIssue,
  ContentValidationIssueTitle,
  ContentValidationIssueDetail,
  ContentValidationIssueMeta,
  ContentValidationIssueActions,
  contentValidationIssueVariants,
  contentValidationIssueMarkVariants,
  CONTENT_VALIDATION_SEVERITY_LABELS,
  type ContentValidationSeverity,
}
