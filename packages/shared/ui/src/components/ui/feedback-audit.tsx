import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type FeedbackAuditOrigin = "ai" | "teacher"

type FeedbackAuditScoreKind =
  | "accuracy"
  | "evidence"
  | "tone"
  | "scope"
  | "effect"

const FEEDBACK_AUDIT_ORIGIN_LABELS: Record<FeedbackAuditOrigin, string> = {
  ai: "AI 피드백",
  teacher: "교사 피드백",
}

const FEEDBACK_AUDIT_SCORE_LABELS: Record<FeedbackAuditScoreKind, string> = {
  accuracy: "정확성",
  evidence: "근거",
  tone: "어조",
  scope: "범위",
  effect: "효과",
}

function FeedbackAudit({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="feedback-audit"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

function FeedbackAuditHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="feedback-audit-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  )
}

function FeedbackAuditTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feedback-audit-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function FeedbackAuditMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="feedback-audit-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function FeedbackAuditList({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="feedback-audit-list"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

const feedbackAuditSampleVariants = cva(
  "flex flex-col gap-3 rounded-2xl border border-border/70 bg-card px-3.5 py-3",
  {
    variants: {
      origin: {
        ai: "",
        teacher: "",
      },
    },
    defaultVariants: {
      origin: "ai",
    },
  }
)

function FeedbackAuditSample({
  className,
  origin = "ai",
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof feedbackAuditSampleVariants> & {
    origin?: FeedbackAuditOrigin
  }) {
  return (
    <li
      data-slot="feedback-audit-sample"
      data-origin={origin}
      className={cn(feedbackAuditSampleVariants({ origin }), className)}
      {...props}
    >
      {children}
    </li>
  )
}

const feedbackAuditOriginVariants = cva(
  "inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-[0.02em]",
  {
    variants: {
      origin: {
        ai: "border-border/80 bg-muted/50 text-foreground/70",
        teacher: "border-border/80 bg-card text-muted-foreground",
      },
    },
    defaultVariants: {
      origin: "ai",
    },
  }
)

function FeedbackAuditSampleOrigin({
  className,
  origin = "ai",
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof feedbackAuditOriginVariants> & {
    origin?: FeedbackAuditOrigin
  }) {
  return (
    <span
      data-slot="feedback-audit-sample-origin"
      data-origin={origin}
      className={cn(feedbackAuditOriginVariants({ origin }), className)}
      {...props}
    >
      {children ?? FEEDBACK_AUDIT_ORIGIN_LABELS[origin]}
    </span>
  )
}

function FeedbackAuditSampleBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feedback-audit-sample-body"
      className={cn(
        "text-sm leading-6 text-pretty text-foreground/90 whitespace-pre-wrap",
        className
      )}
      {...props}
    />
  )
}

function FeedbackAuditScores({
  className,
  ...props
}: React.ComponentProps<"dl">) {
  return (
    <dl
      data-slot="feedback-audit-scores"
      className={cn("flex flex-wrap gap-x-4 gap-y-2", className)}
      {...props}
    />
  )
}

function FeedbackAuditScore({
  className,
  kind,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  kind?: FeedbackAuditScoreKind
}) {
  return (
    <div
      data-slot="feedback-audit-score"
      data-kind={kind}
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function FeedbackAuditScoreLabel({
  className,
  kind,
  children,
  ...props
}: React.ComponentProps<"dt"> & {
  kind?: FeedbackAuditScoreKind
}) {
  return (
    <dt
      data-slot="feedback-audit-score-label"
      data-kind={kind}
      className={cn("text-[11px] text-muted-foreground", className)}
      {...props}
    >
      {children ?? (kind ? FEEDBACK_AUDIT_SCORE_LABELS[kind] : undefined)}
    </dt>
  )
}

function FeedbackAuditScoreValue({
  className,
  ...props
}: React.ComponentProps<"dd">) {
  return (
    <dd
      data-slot="feedback-audit-score-value"
      className={cn("text-sm font-medium tabular-nums", className)}
      {...props}
    />
  )
}

function FeedbackAuditActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feedback-audit-actions"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    />
  )
}

export {
  FeedbackAudit,
  FeedbackAuditHeader,
  FeedbackAuditTitle,
  FeedbackAuditMeta,
  FeedbackAuditList,
  FeedbackAuditSample,
  FeedbackAuditSampleOrigin,
  FeedbackAuditSampleBody,
  FeedbackAuditScores,
  FeedbackAuditScore,
  FeedbackAuditScoreLabel,
  FeedbackAuditScoreValue,
  FeedbackAuditActions,
  feedbackAuditSampleVariants,
  feedbackAuditOriginVariants,
  FEEDBACK_AUDIT_ORIGIN_LABELS,
  FEEDBACK_AUDIT_SCORE_LABELS,
  type FeedbackAuditOrigin,
  type FeedbackAuditScoreKind,
}
